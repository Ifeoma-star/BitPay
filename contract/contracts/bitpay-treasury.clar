;; BitPay Treasury Management Contract
;; Simplified treasury operations for sBTC stream fees and reserves

;; =============================================================================
;; CONSTANTS & ERROR CODES
;; =============================================================================

;; Error codes
(define-constant ERR_UNAUTHORIZED (err u6001))
(define-constant ERR_INSUFFICIENT_BALANCE (err u6002))
(define-constant ERR_INVALID_AMOUNT (err u6003))
(define-constant ERR_TREASURY_LOCKED (err u6004))
(define-constant ERR_INVALID_RECIPIENT (err u6005))

;; Access control reference
(define-constant ACCESS_CONTROL_CONTRACT .bitpay-access-control)

;; sBTC token contract
(define-constant SBTC_TOKEN 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token)

;; Contract versioning
(define-constant CONTRACT_VERSION u1)

;; =============================================================================
;; DATA STRUCTURES
;; =============================================================================

;; Treasury operations tracking
(define-map treasury-operations
    uint ;; operation-id
    {
        operation-type: (string-ascii 32),
        amount: uint,
        recipient: (optional principal),
        initiated-by: principal,
        initiated-at: uint,
        reason: (string-utf8 256),
    }
)

;; Simple yield tracking
(define-map yield-records
    uint ;; period (daily)
    {
        yield-earned: uint,
        fees-collected: uint,
        total-balance: uint,
        recorded-at: uint,
    }
)

;; Contract state
(define-data-var next-operation-id uint u1)
(define-data-var treasury-locked bool false)
(define-data-var total-fees-collected uint u0)
(define-data-var total-yield-earned uint u0)
(define-data-var emergency-reserve-ratio uint u1000) ;; 10% in basis points

;; =============================================================================
;; AUTHORIZATION HELPERS
;; =============================================================================

;; Check treasury access
(define-private (assert-treasury-access (sender principal))
    (asserts!
        (contract-call? ACCESS_CONTROL_CONTRACT has-capability "access-treasury"
            sender
        )
        ERR_UNAUTHORIZED
    )
)

;; Check if treasury is not locked
(define-private (assert-not-locked)
    (asserts! (not (var-get treasury-locked)) ERR_TREASURY_LOCKED)
)

;; =============================================================================
;; CORE FUNCTIONS
;; =============================================================================

;; Withdraw funds from treasury
(define-public (withdraw-funds
        (amount uint)
        (recipient principal)
        (reason (string-utf8 256))
    )
    (let (
            (operation-id (var-get next-operation-id))
            (current-balance (get-treasury-balance))
        )
        ;; Authorization and validation
        (try! (assert-treasury-access tx-sender))
        (try! (assert-not-locked))
        (asserts! (> amount u0) ERR_INVALID_AMOUNT)
        (asserts! (<= amount current-balance) ERR_INSUFFICIENT_BALANCE)

        ;; Record operation
        (map-set treasury-operations operation-id {
            operation-type: "withdrawal",
            amount: amount,
            recipient: (some recipient),
            initiated-by: tx-sender,
            initiated-at: block-height,
            reason: reason,
        })

        ;; Transfer funds
        (try! (as-contract (contract-call? SBTC_TOKEN transfer amount tx-sender recipient none)))

        ;; Update operation ID
        (var-set next-operation-id (+ operation-id u1))

        ;; Emit event
        (print {
            event: "treasury-withdrawal",
            operation-id: operation-id,
            amount: amount,
            recipient: recipient,
            initiated-by: tx-sender,
            reason: reason,
            block-height: block-height,
        })

        (ok operation-id)
    )
)

;; Collect fees from stream operations
(define-public (collect-fees
        (amount uint)
        (source (string-ascii 32))
    )
    (let ((operation-id (var-get next-operation-id)))
        ;; Only core contract can call this
        (asserts! (is-eq tx-sender .bitpay-core) ERR_UNAUTHORIZED)

        ;; Record fee collection
        (map-set treasury-operations operation-id {
            operation-type: "fee-collection",
            amount: amount,
            recipient: none,
            initiated-by: tx-sender,
            initiated-at: block-height,
            reason: (concat u"Fees from " source),
        })

        ;; Update totals
        (var-set total-fees-collected (+ (var-get total-fees-collected) amount))
        (var-set next-operation-id (+ operation-id u1))

        ;; Emit event
        (print {
            event: "fees-collected",
            amount: amount,
            source: source,
            total-fees: (var-get total-fees-collected),
            block-height: block-height,
        })

        (ok true)
    )
)

;; Record yield earnings
(define-public (record-yield
        (amount uint)
        (source (string-ascii 64))
    )
    (let (
            (operation-id (var-get next-operation-id))
            (today (/ block-height u144)) ;; Daily periods
        )
        ;; Authorization check
        (try! (assert-treasury-access tx-sender))

        ;; Record operation
        (map-set treasury-operations operation-id {
            operation-type: "yield-income",
            amount: amount,
            recipient: none,
            initiated-by: tx-sender,
            initiated-at: block-height,
            reason: (concat u"Yield from " source),
        })

        ;; Update yield tracking
        (let ((existing-yield (default-to {
                yield-earned: u0,
                fees-collected: u0,
                total-balance: u0,
                recorded-at: u0,
            }
                (map-get? yield-records today)
            )))
            (map-set yield-records today
                (merge existing-yield {
                    yield-earned: (+ (get yield-earned existing-yield) amount),
                    total-balance: (get-treasury-balance),
                    recorded-at: block-height,
                })
            )
        )

        ;; Update totals
        (var-set total-yield-earned (+ (var-get total-yield-earned) amount))
        (var-set next-operation-id (+ operation-id u1))

        (ok operation-id)
    )
)

;; Lock treasury (emergency only)
(define-public (lock-treasury (reason (string-utf8 256)))
    (begin
        (asserts!
            (contract-call? ACCESS_CONTROL_CONTRACT has-capability
                "emergency-stop" tx-sender
            )
            ERR_UNAUTHORIZED
        )
        (var-set treasury-locked true)

        (print {
            event: "treasury-locked",
            locked-by: tx-sender,
            reason: reason,
            block-height: block-height,
        })

        (ok true)
    )
)

;; Unlock treasury
(define-public (unlock-treasury)
    (begin
        (try! (assert-treasury-access tx-sender))
        (var-set treasury-locked false)

        (print {
            event: "treasury-unlocked",
            unlocked-by: tx-sender,
            block-height: block-height,
        })

        (ok true)
    )
)

;; =============================================================================
;; READ-ONLY FUNCTIONS
;; =============================================================================

;; Get treasury balance
(define-read-only (get-treasury-balance)
    (unwrap-panic (contract-call? SBTC_TOKEN get-balance (as-contract tx-sender)))
)

;; Get treasury summary
(define-read-only (get-treasury-summary)
    {
        balance: (get-treasury-balance),
        total-fees-collected: (var-get total-fees-collected),
        total-yield-earned: (var-get total-yield-earned),
        locked: (var-get treasury-locked),
        emergency-reserve-ratio: (var-get emergency-reserve-ratio),
        next-operation-id: (var-get next-operation-id),
        contract-version: CONTRACT_VERSION,
    }
)

;; Get operation details
(define-read-only (get-operation (operation-id uint))
    (map-get? treasury-operations operation-id)
)

;; Get yield record for period
(define-read-only (get-yield-record (period uint))
    (map-get? yield-records period)
)

;; Calculate emergency reserve amount
(define-read-only (get-emergency-reserve-amount)
    (/ (* (get-treasury-balance) (var-get emergency-reserve-ratio)) u10000)
)

;; =============================================================================
;; ADMIN FUNCTIONS
;; =============================================================================

;; Update emergency reserve ratio
(define-public (update-emergency-reserve-ratio (new-ratio uint))
    (begin
        (try! (assert-treasury-access tx-sender))
        (asserts! (<= new-ratio u5000) ERR_INVALID_AMOUNT) ;; Max 50%

        (var-set emergency-reserve-ratio new-ratio)

        (print {
            event: "emergency-reserve-ratio-updated",
            new-ratio: new-ratio,
            updated-by: tx-sender,
            block-height: block-height,
        })

        (ok true)
    )
)
