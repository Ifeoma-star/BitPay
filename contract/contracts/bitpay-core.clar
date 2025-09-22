;; BitPay Core Stream Management Contract
;; Enterprise-level sBTC streaming payment system
;; Integrated with sBTC protocol for Bitcoin-native payments

;; =============================================================================
;; IMPORTS & DEPENDENCIES
;; =============================================================================

;; Access control reference - deployed testnet contract
(define-constant ACCESS_CONTROL_CONTRACT 'ST2F3J1PK46D6XVRBB9SQ66PY89P8G0EBDW5E05M7.bitpay-access-control)

;; =============================================================================
;; CONSTANTS & ERROR CODES
;; =============================================================================

;; Error codes for stream operations
(define-constant ERR_UNAUTHORIZED (err u5001))
(define-constant ERR_INVALID_STREAM_ID (err u5002))
(define-constant ERR_INVALID_AMOUNT (err u5003))
(define-constant ERR_INVALID_DURATION (err u5004))
(define-constant ERR_INVALID_RECIPIENT (err u5005))
(define-constant ERR_INSUFFICIENT_BALANCE (err u5006))
(define-constant ERR_STREAM_NOT_ACTIVE (err u5007))
(define-constant ERR_STREAM_ALREADY_CANCELLED (err u5008))
(define-constant ERR_STREAM_ALREADY_COMPLETED (err u5009))
(define-constant ERR_NOTHING_TO_WITHDRAW (err u5010))
(define-constant ERR_INVALID_PAUSE_DURATION (err u5011))
(define-constant ERR_STREAM_PAUSED (err u5012))
(define-constant ERR_CONTRACT_PAUSED (err u5013))
(define-constant ERR_INVALID_FEE_RATE (err u5014))
(define-constant ERR_SBTC_TRANSFER_FAILED (err u5015))
(define-constant ERR_STREAM_TOO_SHORT (err u5016))
(define-constant ERR_PAYMENT_TOO_SMALL (err u5017))
(define-constant ERR_MAX_STREAMS_EXCEEDED (err u5018))

;; Stream limits and constraints
(define-constant MIN_STREAM_AMOUNT u546) ;; 546 sats (dust limit)
(define-constant MAX_STREAM_AMOUNT u10000000000) ;; 100 BTC
(define-constant MIN_STREAM_DURATION u1) ;; 1 block minimum
(define-constant MAX_STREAM_DURATION u525600) ;; ~10 years maximum  
(define-constant MIN_PAYMENT_PER_BLOCK u1) ;; 1 sat minimum
(define-constant MAX_ACTIVE_STREAMS_PER_USER u1000) ;; Max streams per user
(define-constant PRECISION_FACTOR u100000000) ;; 8 decimal places

;; sBTC contract addresses (will be updated for different networks)
(define-constant SBTC_TOKEN 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token)

;; Stream states
(define-constant STREAM_ACTIVE u1)
(define-constant STREAM_PAUSED u2)
(define-constant STREAM_CANCELLED u3)
(define-constant STREAM_COMPLETED u4)

;; Contract versioning
(define-constant CONTRACT_VERSION u1)

;; =============================================================================
;; DATA STRUCTURES
;; =============================================================================

;; Main stream data structure
(define-map streams
    uint ;; stream-id
    {
        sender: principal,
        recipient: principal,
        total-amount: uint, ;; Total sBTC amount in satoshis
        amount-per-block: uint, ;; sBTC released per block
        start-block: uint, ;; Block when stream starts
        end-block: uint, ;; Block when stream ends
        last-claim-block: uint, ;; Last block when funds were claimed
        claimed-amount: uint, ;; Total amount claimed so far
        status: uint, ;; Stream status (active/paused/cancelled/completed)
        fee-rate: uint, ;; Fee rate in basis points (e.g., 100 = 1%)
        pause-start-block: (optional uint), ;; Block when stream was paused
        paused-duration: uint, ;; Total blocks paused
        created-at: uint, ;; Block when stream was created
        metadata: (string-utf8 256), ;; Optional metadata for stream
    }
)

;; Stream claimable amounts cache for gas optimization
(define-map stream-claimable-cache
    uint ;; stream-id
    {
        cached-at-block: uint,
        cached-claimable-amount: uint,
        cached-total-released: uint,
    }
)

;; User stream tracking
(define-map user-streams
    principal
    {
        created-streams: (list 1000 uint),
        receiving-streams: (list 1000 uint),
        total-created: uint,
        total-receiving: uint,
        total-volume-sent: uint,
        total-volume-received: uint,
    }
)

;; Global stream statistics
(define-map global-stats
    uint ;; stat-type (1=daily, 2=monthly, 3=all-time)
    {
        total-streams: uint,
        total-volume: uint,
        total-fees-collected: uint,
        active-streams: uint,
        unique-users: uint,
        last-updated: uint,
    }
)

;; Contract state variables
(define-data-var next-stream-id uint u1)
(define-data-var contract-paused bool false)
(define-data-var total-streams-created uint u0)
(define-data-var total-volume uint u0)
(define-data-var default-fee-rate uint u100) ;; 1% in basis points
(define-data-var max-fee-rate uint u1000) ;; 10% max fee
(define-data-var treasury-address principal tx-sender)

;; =============================================================================
;; AUTHORIZATION HELPERS
;; =============================================================================

;; Check if sender has stream management capability
(define-private (assert-can-manage-streams (sender principal))
    (begin
        (asserts!
            (contract-call? ACCESS_CONTROL_CONTRACT has-capability
                "manage-streams" sender
            )
            ERR_UNAUTHORIZED
        )
        (ok true)
    )
)

;; Check if contract is not paused
(define-private (assert-not-paused)
    (begin
        (asserts! (not (var-get contract-paused)) ERR_CONTRACT_PAUSED)
        (ok true)
    )
)

;; Check if sender can pause operations
(define-private (assert-can-pause (sender principal))
    (begin
        (asserts!
            (contract-call? ACCESS_CONTROL_CONTRACT has-capability "pause" sender)
            ERR_UNAUTHORIZED
        )
        (ok true)
    )
)

;; =============================================================================
;; CORE STREAM FUNCTIONS
;; =============================================================================

;; Create a new sBTC stream
(define-public (create-stream
        (recipient principal)
        (total-amount uint)
        (duration-blocks uint)
        (start-delay-blocks uint)
        (metadata (string-utf8 256))
    )
    (begin
        ;; Authorization and validation checks first
        (try! (assert-not-paused))

        ;; Validate input parameters before any calculations
        (asserts! (>= total-amount MIN_STREAM_AMOUNT) ERR_INVALID_AMOUNT)
        (asserts! (<= total-amount MAX_STREAM_AMOUNT) ERR_INVALID_AMOUNT)
        (asserts! (>= duration-blocks MIN_STREAM_DURATION) ERR_INVALID_DURATION)
        (asserts! (<= duration-blocks MAX_STREAM_DURATION) ERR_INVALID_DURATION)
        (asserts! (not (is-eq tx-sender recipient)) ERR_INVALID_RECIPIENT)

        (let (
                (stream-id (var-get next-stream-id))
                (sender tx-sender)
                (current-block stacks-block-height)
                (start-block (+ current-block start-delay-blocks))
                (end-block (+ start-block duration-blocks))
                (amount-per-block (/ total-amount duration-blocks))
                (fee-rate (var-get default-fee-rate))
                (fee-amount (/ (* total-amount fee-rate) u10000))
                (net-amount (- total-amount fee-amount))
                (user-data (default-to {
                    created-streams: (list),
                    receiving-streams: (list),
                    total-created: u0,
                    total-receiving: u0,
                    total-volume-sent: u0,
                    total-volume-received: u0,
                }
                    (map-get? user-streams sender)
                ))
            )
            ;; Additional validation after calculations
            (asserts! (> amount-per-block u0) ERR_PAYMENT_TOO_SMALL)

            ;; Check user stream limits
            (asserts!
                (< (get total-created user-data) MAX_ACTIVE_STREAMS_PER_USER)
                ERR_MAX_STREAMS_EXCEEDED
            )

            ;; Transfer sBTC to contract (including fees)
            (try! (contract-call? SBTC_TOKEN transfer total-amount sender
                (as-contract tx-sender) none
            ))

            ;; Create the stream
            (map-set streams stream-id {
                sender: sender,
                recipient: recipient,
                total-amount: net-amount,
                amount-per-block: (/ net-amount duration-blocks),
                start-block: start-block,
                end-block: end-block,
                last-claim-block: start-block,
                claimed-amount: u0,
                status: STREAM_ACTIVE,
                fee-rate: fee-rate,
                pause-start-block: none,
                paused-duration: u0,
                created-at: current-block,
                metadata: metadata,
            })

            ;; Update user tracking
            (map-set user-streams sender
                (merge user-data {
                    created-streams: (unwrap!
                        (as-max-len?
                            (append (get created-streams user-data) stream-id)
                            u1000
                        )
                        ERR_MAX_STREAMS_EXCEEDED
                    ),
                    total-created: (+ (get total-created user-data) u1),
                    total-volume-sent: (+ (get total-volume-sent user-data) net-amount),
                })
            )

            ;; Update recipient tracking
            (let ((recipient-data (default-to {
                    created-streams: (list),
                    receiving-streams: (list),
                    total-created: u0,
                    total-receiving: u0,
                    total-volume-sent: u0,
                    total-volume-received: u0,
                }
                    (map-get? user-streams recipient)
                )))
                (map-set user-streams recipient
                    (merge recipient-data {
                        receiving-streams: (unwrap!
                            (as-max-len?
                                (append (get receiving-streams recipient-data)
                                    stream-id
                                )
                                u1000
                            )
                            ERR_MAX_STREAMS_EXCEEDED
                        ),
                        total-receiving: (+ (get total-receiving recipient-data) u1),
                        total-volume-received: (+ (get total-volume-received recipient-data) net-amount),
                    })
                )
            )

            ;; Transfer fees to treasury
            (if (> fee-amount u0)
                (try! (as-contract (contract-call? SBTC_TOKEN transfer fee-amount tx-sender
                    (var-get treasury-address) none
                )))
                true
            )

            ;; Update global stats
            (var-set next-stream-id (+ stream-id u1))
            (var-set total-streams-created (+ (var-get total-streams-created) u1))
            (var-set total-volume (+ (var-get total-volume) net-amount))

            ;; Emit event for chainhook integration
            (print {
                event: "stream-created",
                stream-id: stream-id,
                sender: sender,
                recipient: recipient,
                total-amount: net-amount,
                amount-per-block: (/ net-amount duration-blocks),
                duration-blocks: duration-blocks,
                start-block: start-block,
                end-block: end-block,
                fee-amount: fee-amount,
                metadata: metadata,
                block-height: current-block,
                timestamp: stacks-block-height,
            })

            (ok stream-id)
        )
    )
)

;; Claim available funds from a stream
(define-public (claim-stream (stream-id uint))
    (let (
            (stream-data (unwrap! (map-get? streams stream-id) ERR_INVALID_STREAM_ID))
            (claimer tx-sender)
            (current-block stacks-block-height)
            (claimable-info (calculate-claimable-amount stream-id current-block))
            (claimable-amount (get amount claimable-info))
        )
        ;; Authorization checks
        (try! (assert-not-paused))
        (asserts! (is-eq claimer (get recipient stream-data)) ERR_UNAUTHORIZED)
        (asserts! (is-eq (get status stream-data) STREAM_ACTIVE)
            ERR_STREAM_NOT_ACTIVE
        )
        (asserts! (> claimable-amount u0) ERR_NOTHING_TO_WITHDRAW)

        ;; Update stream data
        (map-set streams stream-id
            (merge stream-data {
                last-claim-block: current-block,
                claimed-amount: (+ (get claimed-amount stream-data) claimable-amount),
                status: (if (get stream-ended claimable-info)
                    STREAM_COMPLETED
                    (get status stream-data)
                ),
            })
        )

        ;; Transfer sBTC to recipient
        (try! (as-contract (contract-call? SBTC_TOKEN transfer claimable-amount tx-sender claimer
            none
        )))

        ;; Update cache
        (map-set stream-claimable-cache stream-id {
            cached-at-block: current-block,
            cached-claimable-amount: u0,
            cached-total-released: (+ (get claimed-amount stream-data) claimable-amount),
        })

        ;; Emit event for chainhook integration
        (print {
            event: "stream-claimed",
            stream-id: stream-id,
            recipient: claimer,
            amount-claimed: claimable-amount,
            total-claimed: (+ (get claimed-amount stream-data) claimable-amount),
            stream-completed: (get stream-ended claimable-info),
            block-height: current-block,
            timestamp: stacks-block-height,
        })

        (ok claimable-amount)
    )
)

;; Cancel an active stream
(define-public (cancel-stream (stream-id uint))
    (let (
            (stream-data (unwrap! (map-get? streams stream-id) ERR_INVALID_STREAM_ID))
            (canceller tx-sender)
            (current-block stacks-block-height)
            (claimable-info (calculate-claimable-amount stream-id current-block))
            (claimable-amount (get amount claimable-info))
            (remaining-amount (- (get total-amount stream-data) (get claimed-amount stream-data)
                claimable-amount
            ))
        )
        ;; Authorization checks
        (try! (assert-not-paused))
        (asserts! (is-eq canceller (get sender stream-data)) ERR_UNAUTHORIZED)
        (asserts! (not (is-eq (get status stream-data) STREAM_CANCELLED))
            ERR_STREAM_ALREADY_CANCELLED
        )
        (asserts! (not (is-eq (get status stream-data) STREAM_COMPLETED))
            ERR_STREAM_ALREADY_COMPLETED
        )

        ;; Mark stream as cancelled
        (map-set streams stream-id
            (merge stream-data {
                status: STREAM_CANCELLED,
                last-claim-block: current-block,
            })
        )

        ;; Transfer claimable amount to recipient if any
        (if (> claimable-amount u0)
            (try! (as-contract (contract-call? SBTC_TOKEN transfer claimable-amount tx-sender
                (get recipient stream-data) none
            )))
            true
        )

        ;; Return remaining amount to sender
        (if (> remaining-amount u0)
            (try! (as-contract (contract-call? SBTC_TOKEN transfer remaining-amount tx-sender
                canceller none
            )))
            true
        )

        ;; Emit event for chainhook integration
        (print {
            event: "stream-cancelled",
            stream-id: stream-id,
            cancelled-by: canceller,
            recipient-amount: claimable-amount,
            refunded-amount: remaining-amount,
            block-height: current-block,
            timestamp: stacks-block-height,
        })

        (ok {
            recipient-amount: claimable-amount,
            refunded-amount: remaining-amount,
        })
    )
)

;; Pause a stream (sender only)
(define-public (pause-stream (stream-id uint))
    (let (
            (stream-data (unwrap! (map-get? streams stream-id) ERR_INVALID_STREAM_ID))
            (pauser tx-sender)
            (current-block stacks-block-height)
        )
        ;; Authorization checks
        (try! (assert-not-paused))
        (asserts! (is-eq pauser (get sender stream-data)) ERR_UNAUTHORIZED)
        (asserts! (is-eq (get status stream-data) STREAM_ACTIVE)
            ERR_STREAM_NOT_ACTIVE
        )

        ;; Update stream to paused status
        (map-set streams stream-id
            (merge stream-data {
                status: STREAM_PAUSED,
                pause-start-block: (some current-block),
            })
        )

        ;; Emit event for chainhook integration
        (print {
            event: "stream-paused",
            stream-id: stream-id,
            paused-by: pauser,
            paused-at-block: current-block,
            timestamp: stacks-block-height,
        })

        (ok true)
    )
)

;; Resume a paused stream
(define-public (resume-stream (stream-id uint))
    (let (
            (stream-data (unwrap! (map-get? streams stream-id) ERR_INVALID_STREAM_ID))
            (resumer tx-sender)
            (current-block stacks-block-height)
            (pause-start (unwrap! (get pause-start-block stream-data) ERR_STREAM_NOT_ACTIVE))
            (pause-duration (- current-block pause-start))
        )
        ;; Authorization checks
        (try! (assert-not-paused))
        (asserts! (is-eq resumer (get sender stream-data)) ERR_UNAUTHORIZED)
        (asserts! (is-eq (get status stream-data) STREAM_PAUSED)
            ERR_STREAM_NOT_ACTIVE
        )

        ;; Update stream to active status and extend end block
        (map-set streams stream-id
            (merge stream-data {
                status: STREAM_ACTIVE,
                pause-start-block: none,
                paused-duration: (+ (get paused-duration stream-data) pause-duration),
                end-block: (+ (get end-block stream-data) pause-duration),
            })
        )

        ;; Emit event for chainhook integration
        (print {
            event: "stream-resumed",
            stream-id: stream-id,
            resumed-by: resumer,
            pause-duration: pause-duration,
            new-end-block: (+ (get end-block stream-data) pause-duration),
            block-height: current-block,
            timestamp: stacks-block-height,
        })

        (ok true)
    )
)

;; =============================================================================
;; CALCULATION FUNCTIONS
;; =============================================================================

;; Calculate claimable amount for a stream at a given block
(define-read-only (calculate-claimable-amount
        (stream-id uint)
        (target-block uint)
    )
    (match (map-get? streams stream-id)
        stream-data (let (
                (current-block (if (is-eq target-block u0)
                    stacks-block-height
                    target-block
                ))
                (start-block (get start-block stream-data))
                (end-block (get end-block stream-data))
                (last-claim-block (get last-claim-block stream-data))
                (amount-per-block (get amount-per-block stream-data))
                (claimed-amount (get claimed-amount stream-data))
                (total-amount (get total-amount stream-data))
                (paused-duration (get paused-duration stream-data))
                (status (get status stream-data))
            )
            (if (or (is-eq status STREAM_CANCELLED) (is-eq status STREAM_COMPLETED))
                {
                    amount: u0,
                    stream-ended: true,
                    blocks-elapsed: u0,
                }
                (if (< current-block start-block)
                    {
                        amount: u0,
                        stream-ended: false,
                        blocks-elapsed: u0,
                    }
                    (let (
                            (effective-current-block (if (> current-block end-block)
                                end-block
                                current-block
                            ))
                            (blocks-since-last-claim (- effective-current-block last-claim-block))
                            (claimable-amount (* blocks-since-last-claim amount-per-block))
                            (capped-amount (if (> (+ claimed-amount claimable-amount)
                                    total-amount
                                )
                                (- total-amount claimed-amount)
                                claimable-amount
                            ))
                            (stream-ended (>= effective-current-block end-block))
                        )
                        {
                            amount: capped-amount,
                            stream-ended: stream-ended,
                            blocks-elapsed: blocks-since-last-claim,
                        }
                    )
                )
            )
        )
        {
            amount: u0,
            stream-ended: false,
            blocks-elapsed: u0,
        }
    )
)

;; Calculate stream progress percentage (in basis points)
(define-read-only (calculate-stream-progress (stream-id uint))
    (match (map-get? streams stream-id)
        stream-data (let (
                (current-block stacks-block-height)
                (start-block (get start-block stream-data))
                (end-block (get end-block stream-data))
                (total-duration (- end-block start-block))
            )
            (if (< current-block start-block)
                u0 ;; Not started
                (if (>= current-block end-block)
                    u10000 ;; 100% in basis points
                    (/ (* (- current-block start-block) u10000) total-duration)
                )
            )
        )
        u0
    )
)

;; =============================================================================
;; READ-ONLY FUNCTIONS
;; =============================================================================

;; Get complete stream information
(define-read-only (get-stream (stream-id uint))
    (match (map-get? streams stream-id)
        stream-data (let (
                (claimable-info (calculate-claimable-amount stream-id u0))
                (progress (calculate-stream-progress stream-id))
            )
            (some (merge stream-data {
                claimable-amount: (get amount claimable-info),
                progress-percentage: progress,
                stream-ended: (get stream-ended claimable-info),
            }))
        )
        none
    )
)

;; Get user stream summary
(define-read-only (get-user-streams (user principal))
    (map-get? user-streams user)
)

;; Get global statistics
(define-read-only (get-global-stats)
    {
        total-streams: (var-get total-streams-created),
        total-volume: (var-get total-volume),
        contract-version: CONTRACT_VERSION,
        contract-paused: (var-get contract-paused),
        default-fee-rate: (var-get default-fee-rate),
    }
)

;; Get contract configuration
(define-read-only (get-contract-config)
    {
        min-stream-amount: MIN_STREAM_AMOUNT,
        max-stream-amount: MAX_STREAM_AMOUNT,
        min-duration: MIN_STREAM_DURATION,
        max-duration: MAX_STREAM_DURATION,
        max-streams-per-user: MAX_ACTIVE_STREAMS_PER_USER,
        default-fee-rate: (var-get default-fee-rate),
        max-fee-rate: (var-get max-fee-rate),
        treasury-address: (var-get treasury-address),
    }
)

;; =============================================================================
;; ADMIN FUNCTIONS
;; =============================================================================

;; Pause contract (emergency only)
(define-public (pause-contract)
    (begin
        (try! (assert-can-pause tx-sender))
        (var-set contract-paused true)

        ;; Emit event for chainhook integration
        (print {
            event: "contract-paused",
            paused-by: tx-sender,
            block-height: stacks-block-height,
            timestamp: stacks-block-height,
        })

        (ok true)
    )
)

;; Unpause contract
(define-public (unpause-contract)
    (begin
        (try! (assert-can-pause tx-sender))
        (var-set contract-paused false)

        ;; Emit event for chainhook integration
        (print {
            event: "contract-unpaused",
            unpaused-by: tx-sender,
            block-height: stacks-block-height,
            timestamp: stacks-block-height,
        })

        (ok true)
    )
)

;; Update fee rate (fee manager only)
(define-public (update-default-fee-rate (new-rate uint))
    (begin
        (asserts!
            (contract-call? ACCESS_CONTROL_CONTRACT has-capability "modify-fees"
                tx-sender
            )
            ERR_UNAUTHORIZED
        )
        (asserts! (<= new-rate (var-get max-fee-rate)) ERR_INVALID_FEE_RATE)

        (let ((old-rate (var-get default-fee-rate)))
            (var-set default-fee-rate new-rate)

            ;; Emit event for chainhook integration
            (print {
                event: "fee-rate-updated",
                old-rate: old-rate,
                new-rate: new-rate,
                updated-by: tx-sender,
                block-height: stacks-block-height,
                timestamp: stacks-block-height,
            })

            (ok true)
        )
    )
)

;; Update treasury address (admin only)
(define-public (update-treasury-address (new-treasury principal))
    (begin
        (asserts!
            (contract-call? ACCESS_CONTROL_CONTRACT has-capability
                "access-treasury" tx-sender
            )
            ERR_UNAUTHORIZED
        )

        (let ((old-treasury (var-get treasury-address)))
            (var-set treasury-address new-treasury)

            ;; Emit event for chainhook integration
            (print {
                event: "treasury-address-updated",
                old-treasury: old-treasury,
                new-treasury: new-treasury,
                updated-by: tx-sender,
                block-height: stacks-block-height,
                timestamp: stacks-block-height,
            })

            (ok true)
        )
    )
)
