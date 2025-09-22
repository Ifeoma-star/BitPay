;; BitPay Access Control Contract

;; =============================================================================
;; CONSTANTS & ERROR CODES
;; =============================================================================

;; Error codes for access control
(define-constant ERR_UNAUTHORIZED (err u4001))
(define-constant ERR_INVALID_ROLE (err u4002))
(define-constant ERR_ROLE_NOT_GRANTED (err u4003))
(define-constant ERR_CANNOT_RENOUNCE_ADMIN_ROLE (err u4004))

;; Role identifiers - simple uint constants for efficiency
(define-constant ADMIN_ROLE u1)
(define-constant OPERATOR_ROLE u2)
(define-constant TREASURY_ROLE u3)
(define-constant EMERGENCY_ROLE u4)
(define-constant STREAM_MANAGER_ROLE u5)
(define-constant FEE_MANAGER_ROLE u6)

;; Contract versioning
(define-constant CONTRACT_VERSION u1)

;; =============================================================================
;; DATA STRUCTURES
;; =============================================================================

;; Simplified role assignments: principal -> list of roles
(define-map user-roles
    principal
    (list 10 uint)
)

;; Critical role transfers (admin only)
(define-map pending-admin-transfer
    principal ;; current admin
    {
        to: principal,
        initiated-at: uint,
    }
)

;; Contract state
(define-data-var contract-owner principal tx-sender)

;; =============================================================================
;; INITIALIZATION
;; =============================================================================

;; Grant admin role to contract deployer
(map-set user-roles tx-sender (list ADMIN_ROLE))

;; =============================================================================
;; READ-ONLY FUNCTIONS (DEFINED FIRST)
;; =============================================================================

;; Check if user has specific role
(define-read-only (has-role
        (role uint)
        (user principal)
    )
    (is-some (index-of (default-to (list) (map-get? user-roles user)) role))
)

;; Check if user has specific capability
(define-read-only (has-capability
        (capability (string-ascii 20))
        (user principal)
    )
    (if (is-eq capability "pause")
        (or
            (has-role ADMIN_ROLE user)
            (has-role OPERATOR_ROLE user)
            (has-role EMERGENCY_ROLE user)
        )
        (if (is-eq capability "emergency-stop")
            (or (has-role ADMIN_ROLE user) (has-role EMERGENCY_ROLE user))
            (if (is-eq capability "modify-fees")
                (or (has-role ADMIN_ROLE user) (has-role FEE_MANAGER_ROLE user))
                (if (is-eq capability "access-treasury")
                    (or (has-role ADMIN_ROLE user) (has-role TREASURY_ROLE user))
                    (if (is-eq capability "manage-streams")
                        (or
                            (has-role ADMIN_ROLE user)
                            (has-role OPERATOR_ROLE user)
                            (has-role STREAM_MANAGER_ROLE user)
                        )
                        (if (is-eq capability "analytics")
                            (has-role ADMIN_ROLE user)
                            (if (is-eq capability "sbtc-integration")
                                (has-role ADMIN_ROLE user)
                                false
                            )
                        )
                    )
                )
            )
        )
    )
)

;; Get user roles
(define-read-only (get-user-roles (user principal))
    (map-get? user-roles user)
)

;; Get contract info
(define-read-only (get-contract-info)
    {
        version: CONTRACT_VERSION,
        owner: (var-get contract-owner),
    }
)

;; =============================================================================
;; HELPER FUNCTIONS
;; =============================================================================

;; Simple role removal - just rebuild the list without the target role
(define-private (remove-role-from-list
        (roles (list 10 uint))
        (role-to-remove uint)
    )
    (let (
            (role-0 (element-at roles u0))
            (role-1 (element-at roles u1))
            (role-2 (element-at roles u2))
        )
        (if (is-eq (len roles) u0)
            (list)
            (if (is-eq (len roles) u1)
                (if (is-eq (unwrap-panic role-0) role-to-remove)
                    (list)
                    roles
                )
                (if (is-eq (len roles) u2)
                    (if (is-eq (unwrap-panic role-0) role-to-remove)
                        (list (unwrap-panic role-1))
                        (if (is-eq (unwrap-panic role-1) role-to-remove)
                            (list (unwrap-panic role-0))
                            roles
                        )
                    )
                    ;; For 3+ roles, filter manually
                    (filter-roles-manually roles role-to-remove)
                )
            )
        )
    )
)

;; Manual role filtering for lists with 3+ roles
(define-private (filter-roles-manually
        (roles (list 10 uint))
        (target uint)
    )
    (let ((filtered (list)))
        (if (> (len roles) u0)
            (let ((r0 (unwrap-panic (element-at roles u0))))
                (if (not (is-eq r0 target))
                    (let ((filtered-1 (unwrap! (as-max-len? (append filtered r0) u10) filtered)))
                        (if (> (len roles) u1)
                            (let ((r1 (unwrap-panic (element-at roles u1))))
                                (if (not (is-eq r1 target))
                                    (unwrap!
                                        (as-max-len? (append filtered-1 r1) u10)
                                        filtered-1
                                    )
                                    filtered-1
                                )
                            )
                            filtered-1
                        )
                    )
                    filtered
                )
            )
            filtered
        )
    )
)

;; =============================================================================
;; CORE FUNCTIONS
;; =============================================================================

;; Grant role to user (admin only)
(define-public (grant-role
        (role uint)
        (user principal)
    )
    (let ((current-roles (default-to (list) (map-get? user-roles user))))
        (asserts! (has-role ADMIN_ROLE tx-sender) ERR_UNAUTHORIZED)
        (asserts! (and (>= role u1) (<= role u6)) ERR_INVALID_ROLE)
        (asserts! (not (has-role role user)) ERR_UNAUTHORIZED)

        (map-set user-roles user
            (unwrap! (as-max-len? (append current-roles role) u10)
                ERR_INVALID_ROLE
            ))

        (print {
            event: "role-granted",
            role: role,
            user: user,
            granted-by: tx-sender,
            block-height: stacks-block-height,
        })

        (ok true)
    )
)

;; Revoke role from user (admin only)
(define-public (revoke-role
        (role uint)
        (user principal)
    )
    (let ((current-roles (default-to (list) (map-get? user-roles user))))
        (asserts! (has-role ADMIN_ROLE tx-sender) ERR_UNAUTHORIZED)
        (asserts! (has-role role user) ERR_ROLE_NOT_GRANTED)

        ;; Prevent removing last admin
        (asserts! (or (not (is-eq role ADMIN_ROLE)) (not (is-eq user tx-sender)))
            ERR_CANNOT_RENOUNCE_ADMIN_ROLE
        )

        (map-set user-roles user (remove-role-from-list current-roles role))

        (print {
            event: "role-revoked",
            role: role,
            user: user,
            revoked-by: tx-sender,
            block-height: stacks-block-height,
        })

        (ok true)
    )
)

;; Initiate admin transfer (current admin only)
(define-public (initiate-admin-transfer (new-admin principal))
    (begin
        (asserts! (has-role ADMIN_ROLE tx-sender) ERR_UNAUTHORIZED)

        (map-set pending-admin-transfer tx-sender {
            to: new-admin,
            initiated-at: stacks-block-height,
        })

        (print {
            event: "admin-transfer-initiated",
            from: tx-sender,
            to: new-admin,
            block-height: stacks-block-height,
        })

        (ok true)
    )
)

;; Accept admin transfer
(define-public (accept-admin-transfer (from-admin principal))
    (let ((transfer-data (unwrap! (map-get? pending-admin-transfer from-admin) ERR_UNAUTHORIZED)))
        (asserts! (is-eq tx-sender (get to transfer-data)) ERR_UNAUTHORIZED)
        (asserts!
            (>= (- stacks-block-height (get initiated-at transfer-data)) u144)
            ERR_UNAUTHORIZED
        )
        ;; 24 hour delay

        ;; Grant admin to new user
        (try! (grant-role ADMIN_ROLE tx-sender))
        ;; Revoke from old admin  
        (try! (revoke-role ADMIN_ROLE from-admin))

        ;; Clean up
        (map-delete pending-admin-transfer from-admin)

        (ok true)
    )
)
