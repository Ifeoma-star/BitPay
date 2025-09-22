;; BitPay sBTC Integration Contract
;; Simplified sBTC protocol integration for deposit/withdrawal operations

;; =============================================================================
;; CONSTANTS & ERROR CODES
;; =============================================================================

;; Error codes
(define-constant ERR_UNAUTHORIZED (err u9001))
(define-constant ERR_INVALID_AMOUNT (err u9002))
(define-constant ERR_OPERATION_FAILED (err u9003))
(define-constant ERR_INTEGRATION_DISABLED (err u9004))

;; sBTC protocol contracts (mainnet addresses - update for testnet)
(define-constant SBTC_TOKEN 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-Bitcoin)
(define-constant SBTC_DEPOSIT 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.sbtc-deposit)
(define-constant SBTC_WITHDRAWAL 'SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.sbtc-withdrawal)

;; Access control reference
(define-constant ACCESS_CONTROL_CONTRACT .bitpay-access-control)

;; Contract versioning
(define-constant CONTRACT_VERSION u1)

;; =============================================================================
;; DATA STRUCTURES
;; =============================================================================

;; sBTC operation tracking (simplified)
(define-map sbtc-operations
    uint ;; operation-id
    {
        operation-type: (string-ascii 16), ;; "deposit" or "withdrawal"
        amount: uint,
        user: principal,
        bitcoin-address: (optional (string-ascii 64)),
        status: uint, ;; 1=pending, 2=completed, 3=failed
        initiated-at: uint,
        completed-at: (optional uint),
    }
)

;; Contract state
(define-data-var next-operation-id uint u1)
(define-data-var integration-enabled bool true)

;; =============================================================================
;; AUTHORIZATION HELPERS
;; =============================================================================

;; Check integration access
(define-private (assert-integration-access (sender principal))
    (asserts! (contract-call? ACCESS_CONTROL_CONTRACT has-capability "sbtc-integration" sender) ERR_UNAUTHORIZED)
)

;; Check if integration is enabled
(define-private (assert-integration-enabled)
    (asserts! (var-get integration-enabled) ERR_INTEGRATION_DISABLED)
)

;; =============================================================================
;; CORE FUNCTIONS
;; =============================================================================

;; Initiate sBTC deposit (Bitcoin -> sBTC)
(define-public (initiate-deposit (amount uint) (bitcoin-address (string-ascii 64)))
    (let ((operation-id (var-get next-operation-id)))
        ;; Authorization and validation
        (try! (assert-integration-enabled))
        (asserts! (> amount u0) ERR_INVALID_AMOUNT)
        
        ;; Record operation
        (map-set sbtc-operations operation-id {
            operation-type: "deposit",
            amount: amount,
            user: tx-sender,
            bitcoin-address: (some bitcoin-address),
            status: u1, ;; pending
            initiated-at: stacks-block-height,
            completed-at: none,
        })
        
        ;; Update operation ID
        (var-set next-operation-id (+ operation-id u1))
        
        ;; Emit event for backend processing
        (print {
            event: "deposit-initiated",
            operation-id: operation-id,
            user: tx-sender,
            amount: amount,
            bitcoin-address: bitcoin-address,
            block-height: stacks-block-height
        })
        
        (ok operation-id)
    )
)

;; Initiate sBTC withdrawal (sBTC -> Bitcoin)
(define-public (initiate-withdrawal (amount uint) (bitcoin-address (string-ascii 64)))
    (let ((operation-id (var-get next-operation-id)))
        ;; Authorization and validation
        (try! (assert-integration-enabled))
        (asserts! (> amount u0) ERR_INVALID_AMOUNT)
        
        ;; Verify user has sufficient sBTC balance (let sBTC contract handle the actual validation)
        
        ;; Record operation
        (map-set sbtc-operations operation-id {
            operation-type: "withdrawal",
            amount: amount,
            user: tx-sender,
            bitcoin-address: (some bitcoin-address),
            status: u1, ;; pending
            initiated-at: stacks-block-height,
            completed-at: none,
        })
        
        ;; Update operation ID
        (var-set next-operation-id (+ operation-id u1))
        
        ;; Emit event for backend processing
        (print {
            event: "withdrawal-initiated",
            operation-id: operation-id,
            user: tx-sender,
            amount: amount,
            bitcoin-address: bitcoin-address,
            block-height: stacks-block-height
        })
        
        (ok operation-id)
    )
)

;; Update operation status (backend/coordinator only)
(define-public (update-operation-status (operation-id uint) (new-status uint))
    (let ((operation (unwrap! (map-get? sbtc-operations operation-id) ERR_OPERATION_FAILED)))
        ;; Only authorized integrators can update status
        (try! (assert-integration-access tx-sender))
        
        ;; Update operation
        (map-set sbtc-operations operation-id (merge operation {
            status: new-status,
            completed-at: (if (or (is-eq new-status u2) (is-eq new-status u3))
                (some stacks-block-height)
                none)
        }))
        
        ;; Emit event
        (print {
            event: "operation-status-updated",
            operation-id: operation-id,
            status: new-status,
            updated-by: tx-sender,
            block-height: stacks-block-height
        })
        
        (ok true)
    )
)

;; =============================================================================
;; READ-ONLY FUNCTIONS
;; =============================================================================

;; Get operation details
(define-read-only (get-operation (operation-id uint))
    (map-get? sbtc-operations operation-id)
)

;; Get integration summary
(define-read-only (get-integration-status)
    {
        enabled: (var-get integration-enabled),
        next-operation-id: (var-get next-operation-id),
        contract-version: CONTRACT_VERSION
    }
)

;; =============================================================================
;; ADMIN FUNCTIONS
;; =============================================================================

;; Enable/disable integration
(define-public (set-integration-enabled (enabled bool))
    (begin
        (try! (assert-integration-access tx-sender))
        (var-set integration-enabled enabled)
        
        (print {
            event: "integration-status-changed",
            enabled: enabled,
            changed-by: tx-sender,
            block-height: stacks-block-height
        })
        
        (ok true)
    )
)