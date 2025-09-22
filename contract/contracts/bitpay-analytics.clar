;; BitPay Analytics Contract
;; Minimal on-chain analytics - most processing moved to backend

;; =============================================================================
;; CONSTANTS & ERROR CODES
;; =============================================================================

;; Error codes
(define-constant ERR_UNAUTHORIZED (err u8001))
(define-constant ERR_INVALID_METRIC (err u8002))

;; Access control reference
(define-constant ACCESS_CONTROL_CONTRACT .bitpay-access-control)

;; Contract versioning
(define-constant CONTRACT_VERSION u1)

;; =============================================================================
;; DATA STRUCTURES
;; =============================================================================

;; Simple metric updates (backend processes these events)
(define-map metric-updates
    uint ;; update-id
    {
        metric-type: (string-ascii 32),
        value: uint,
        source: (string-ascii 32),
        updated-by: principal,
        updated-at: uint,
    }
)

;; Contract state
(define-data-var next-update-id uint u1)
(define-data-var analytics-enabled bool true)

;; =============================================================================
;; AUTHORIZATION HELPERS
;; =============================================================================

;; Check analytics access
(define-private (assert-analytics-access (sender principal))
    (asserts! (contract-call? ACCESS_CONTROL_CONTRACT has-capability "analytics" sender) ERR_UNAUTHORIZED)
)

;; =============================================================================
;; CORE FUNCTIONS
;; =============================================================================

;; Update metric (core contracts call this)
(define-public (update-metric 
    (metric-type (string-ascii 32))
    (value uint)
    (source (string-ascii 32)))
    (let ((update-id (var-get next-update-id)))
        ;; Authorization check - only system contracts can update
        (try! (assert-analytics-access tx-sender))
        (asserts! (var-get analytics-enabled) ERR_UNAUTHORIZED)
        
        ;; Record update
        (map-set metric-updates update-id {
            metric-type: metric-type,
            value: value,
            source: source,
            updated-by: tx-sender,
            updated-at: stacks-block-height,
        })
        
        ;; Update ID
        (var-set next-update-id (+ update-id u1))
        
        ;; Emit event for backend processing
        (print {
            event: "metric-updated",
            update-id: update-id,
            metric-type: metric-type,
            value: value,
            source: source,
            updated-by: tx-sender,
            block-height: stacks-block-height
        })
        
        (ok update-id)
    )
)

;; =============================================================================
;; READ-ONLY FUNCTIONS
;; =============================================================================

;; Get metric update
(define-read-only (get-metric-update (update-id uint))
    (map-get? metric-updates update-id)
)

;; Get analytics status
(define-read-only (get-analytics-status)
    {
        enabled: (var-get analytics-enabled),
        next-update-id: (var-get next-update-id),
        contract-version: CONTRACT_VERSION
    }
)

;; =============================================================================
;; ADMIN FUNCTIONS
;; =============================================================================

;; Enable/disable analytics
(define-public (set-analytics-enabled (enabled bool))
    (begin
        (try! (assert-analytics-access tx-sender))
        (var-set analytics-enabled enabled)
        
        (print {
            event: "analytics-status-changed",
            enabled: enabled,
            changed-by: tx-sender,
            block-height: stacks-block-height
        })
        
        (ok true)
    )
)