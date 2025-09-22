;; BitPay Emergency Controls Contract
;; Simple circuit breaker and emergency pause functionality

;; =============================================================================
;; CONSTANTS & ERROR CODES
;; =============================================================================

;; Error codes
(define-constant ERR_UNAUTHORIZED (err u7001))
(define-constant ERR_SYSTEM_ALREADY_PAUSED (err u7002))
(define-constant ERR_SYSTEM_NOT_PAUSED (err u7003))

;; Contract references
(define-constant ACCESS_CONTROL_CONTRACT .bitpay-access-control)
(define-constant CORE_CONTRACT .bitpay-core)
(define-constant TREASURY_CONTRACT .bitpay-treasury)

;; System states
(define-constant STATE_NORMAL u1)
(define-constant STATE_PAUSED u2)
(define-constant STATE_EMERGENCY_STOP u3)

;; Contract versioning
(define-constant CONTRACT_VERSION u1)

;; =============================================================================
;; DATA STRUCTURES
;; =============================================================================

;; Simple emergency actions log
(define-map emergency-actions
    uint ;; action-id
    {
        action-type: (string-ascii 20), ;; "pause", "unpause", "emergency-stop"
        reason: (string-utf8 256),
        triggered-by: principal,
        triggered-at: uint,
    }
)

;; Contract state
(define-data-var current-system-state uint STATE_NORMAL)
(define-data-var next-action-id uint u1)
(define-data-var system-paused-at (optional uint) none)

;; =============================================================================
;; AUTHORIZATION HELPERS
;; =============================================================================

;; Check emergency access
(define-private (assert-emergency-access (sender principal))
    (asserts!
        (contract-call? ACCESS_CONTROL_CONTRACT has-capability "emergency-stop"
            sender
        )
        ERR_UNAUTHORIZED
    )
)

;; Check pause access
(define-private (assert-pause-access (sender principal))
    (asserts!
        (contract-call? ACCESS_CONTROL_CONTRACT has-capability "pause" sender)
        ERR_UNAUTHORIZED
    )
)

;; =============================================================================
;; CORE FUNCTIONS
;; =============================================================================

;; Pause system (operator level)
(define-public (pause-system (reason (string-utf8 256)))
    (let ((action-id (var-get next-action-id)))
        ;; Authorization check
        (try! (assert-pause-access tx-sender))
        (asserts! (not (is-eq (var-get current-system-state) STATE_PAUSED))
            ERR_SYSTEM_ALREADY_PAUSED
        )

        ;; Update state
        (var-set current-system-state STATE_PAUSED)
        (var-set system-paused-at (some stacks-block-height))

        ;; Pause core contracts
        (try! (contract-call? CORE_CONTRACT pause-contract))

        ;; Log action
        (map-set emergency-actions action-id {
            action-type: "pause",
            reason: reason,
            triggered-by: tx-sender,
            triggered-at: stacks-block-height,
        })

        ;; Update action ID
        (var-set next-action-id (+ action-id u1))

        ;; Emit event
        (print {
            event: "system-paused",
            action-id: action-id,
            paused-by: tx-sender,
            reason: reason,
            block-height: stacks-block-height,
        })

        (ok action-id)
    )
)

;; Unpause system
(define-public (unpause-system (reason (string-utf8 256)))
    (let ((action-id (var-get next-action-id)))
        ;; Authorization check
        (try! (assert-pause-access tx-sender))
        (asserts! (is-eq (var-get current-system-state) STATE_PAUSED)
            ERR_SYSTEM_NOT_PAUSED
        )

        ;; Update state
        (var-set current-system-state STATE_NORMAL)
        (var-set system-paused-at none)

        ;; Unpause core contracts
        (try! (contract-call? CORE_CONTRACT unpause-contract))

        ;; Log action
        (map-set emergency-actions action-id {
            action-type: "unpause",
            reason: reason,
            triggered-by: tx-sender,
            triggered-at: stacks-block-height,
        })

        ;; Update action ID
        (var-set next-action-id (+ action-id u1))

        ;; Emit event
        (print {
            event: "system-unpaused",
            action-id: action-id,
            unpaused-by: tx-sender,
            reason: reason,
            block-height: stacks-block-height,
        })

        (ok action-id)
    )
)

;; Emergency stop (highest level - admin/emergency role only)
(define-public (emergency-stop (reason (string-utf8 256)))
    (let ((action-id (var-get next-action-id)))
        ;; Authorization check
        (try! (assert-emergency-access tx-sender))

        ;; Update state
        (var-set current-system-state STATE_EMERGENCY_STOP)
        (var-set system-paused-at (some stacks-block-height))

        ;; Emergency actions
        (try! (contract-call? CORE_CONTRACT pause-contract))
        (try! (contract-call? TREASURY_CONTRACT lock-treasury reason))

        ;; Log action
        (map-set emergency-actions action-id {
            action-type: "emergency-stop",
            reason: reason,
            triggered-by: tx-sender,
            triggered-at: stacks-block-height,
        })

        ;; Update action ID
        (var-set next-action-id (+ action-id u1))

        ;; Emit event
        (print {
            event: "emergency-stop-activated",
            action-id: action-id,
            activated-by: tx-sender,
            reason: reason,
            block-height: stacks-block-height,
        })

        (ok action-id)
    )
)

;; =============================================================================
;; READ-ONLY FUNCTIONS
;; =============================================================================

;; Get system state
(define-read-only (get-system-state)
    {
        current-state: (var-get current-system-state),
        paused-at: (var-get system-paused-at),
        next-action-id: (var-get next-action-id),
        contract-version: CONTRACT_VERSION,
    }
)

;; Get emergency action details
(define-read-only (get-emergency-action (action-id uint))
    (map-get? emergency-actions action-id)
)

;; Check if system is operational
(define-read-only (is-system-operational)
    (is-eq (var-get current-system-state) STATE_NORMAL)
)
