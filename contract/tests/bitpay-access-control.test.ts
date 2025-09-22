
import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const address3 = accounts.get("wallet_3")!;

// Role constants matching the contract
const ADMIN_ROLE = 1;
const OPERATOR_ROLE = 2;
const TREASURY_ROLE = 3;
const EMERGENCY_ROLE = 4;

describe("BitPay Access Control Contract", () => {
  describe("Initialization", () => {
    it("should grant admin role to deployer on initialization", () => {
      const { result } = simnet.callReadOnlyFn(
        "bitpay-access-control",
        "has-role",
        [Cl.uint(ADMIN_ROLE), Cl.principal(deployer)],
        deployer
      );
      expect(result).toBeBool(true);
    });

    it("should return correct contract info", () => {
      const { result } = simnet.callReadOnlyFn(
        "bitpay-access-control",
        "get-contract-info",
        [],
        deployer
      );
      expect(result).toBeTuple({
        version: Cl.uint(1),
        owner: Cl.principal(deployer)
      });
    });
  });

  describe("Role Management", () => {
    it("should allow admin to grant roles to users", () => {
      const { result } = simnet.callPublicFn(
        "bitpay-access-control",
        "grant-role",
        [Cl.uint(OPERATOR_ROLE), Cl.principal(address1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));

      // Verify role was granted
      const hasRole = simnet.callReadOnlyFn(
        "bitpay-access-control",
        "has-role",
        [Cl.uint(OPERATOR_ROLE), Cl.principal(address1)],
        deployer
      );
      expect(hasRole.result).toBeBool(true);
    });

    it("should not allow non-admin to grant roles", () => {
      const { result } = simnet.callPublicFn(
        "bitpay-access-control",
        "grant-role",
        [Cl.uint(OPERATOR_ROLE), Cl.principal(address2)],
        address1 // Non-admin trying to grant
      );
      expect(result).toBeErr(Cl.uint(4001)); // ERR_UNAUTHORIZED
    });

    it("should allow admin to revoke roles from users", () => {
      // First grant a role
      simnet.callPublicFn(
        "bitpay-access-control",
        "grant-role",
        [Cl.uint(OPERATOR_ROLE), Cl.principal(address1)],
        deployer
      );

      // Then revoke it
      const { result } = simnet.callPublicFn(
        "bitpay-access-control",
        "revoke-role",
        [Cl.uint(OPERATOR_ROLE), Cl.principal(address1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));

      // Verify role was revoked
      const hasRole = simnet.callReadOnlyFn(
        "bitpay-access-control",
        "has-role",
        [Cl.uint(OPERATOR_ROLE), Cl.principal(address1)],
        deployer
      );
      expect(hasRole.result).toBeBool(false);
    });

    it("should not allow revoking role that user doesn't have", () => {
      const { result } = simnet.callPublicFn(
        "bitpay-access-control",
        "revoke-role",
        [Cl.uint(OPERATOR_ROLE), Cl.principal(address1)],
        deployer
      );
      expect(result).toBeErr(Cl.uint(4003)); // ERR_ROLE_NOT_GRANTED
    });

    it("should not allow admin to revoke their own admin role", () => {
      const { result } = simnet.callPublicFn(
        "bitpay-access-control",
        "revoke-role",
        [Cl.uint(ADMIN_ROLE), Cl.principal(deployer)],
        deployer
      );
      expect(result).toBeErr(Cl.uint(4004)); // ERR_CANNOT_RENOUNCE_ADMIN_ROLE
    });
  });

  describe("Capability Checks", () => {
    it("should check pause capability correctly", () => {
      // Grant roles for testing
      simnet.callPublicFn(
        "bitpay-access-control",
        "grant-role",
        [Cl.uint(OPERATOR_ROLE), Cl.principal(address1)],
        deployer
      );
      simnet.callPublicFn(
        "bitpay-access-control",
        "grant-role",
        [Cl.uint(EMERGENCY_ROLE), Cl.principal(address3)],
        deployer
      );

      // Admin should have pause capability
      const adminResult = simnet.callReadOnlyFn(
        "bitpay-access-control",
        "has-capability",
        [Cl.stringAscii("pause"), Cl.principal(deployer)],
        deployer
      );
      expect(adminResult.result).toBeBool(true);

      // Operator should have pause capability
      const operatorResult = simnet.callReadOnlyFn(
        "bitpay-access-control",
        "has-capability",
        [Cl.stringAscii("pause"), Cl.principal(address1)],
        deployer
      );
      expect(operatorResult.result).toBeBool(true);

      // Emergency role should have pause capability
      const emergencyResult = simnet.callReadOnlyFn(
        "bitpay-access-control",
        "has-capability",
        [Cl.stringAscii("pause"), Cl.principal(address3)],
        deployer
      );
      expect(emergencyResult.result).toBeBool(true);
    });

    it("should check treasury access capability correctly", () => {
      // Grant treasury role
      simnet.callPublicFn(
        "bitpay-access-control",
        "grant-role",
        [Cl.uint(TREASURY_ROLE), Cl.principal(address2)],
        deployer
      );

      // Admin should have treasury access
      const adminResult = simnet.callReadOnlyFn(
        "bitpay-access-control",
        "has-capability",
        [Cl.stringAscii("access-treasury"), Cl.principal(deployer)],
        deployer
      );
      expect(adminResult.result).toBeBool(true);

      // Treasury role should have treasury access
      const treasuryResult = simnet.callReadOnlyFn(
        "bitpay-access-control",
        "has-capability",
        [Cl.stringAscii("access-treasury"), Cl.principal(address2)],
        deployer
      );
      expect(treasuryResult.result).toBeBool(true);
    });

    it("should check emergency-stop capability correctly", () => {
      // Grant emergency role
      simnet.callPublicFn(
        "bitpay-access-control",
        "grant-role",
        [Cl.uint(EMERGENCY_ROLE), Cl.principal(address3)],
        deployer
      );

      // Admin should have emergency-stop capability
      const adminResult = simnet.callReadOnlyFn(
        "bitpay-access-control",
        "has-capability",
        [Cl.stringAscii("emergency-stop"), Cl.principal(deployer)],
        deployer
      );
      expect(adminResult.result).toBeBool(true);

      // Emergency role should have emergency-stop capability
      const emergencyResult = simnet.callReadOnlyFn(
        "bitpay-access-control",
        "has-capability",
        [Cl.stringAscii("emergency-stop"), Cl.principal(address3)],
        deployer
      );
      expect(emergencyResult.result).toBeBool(true);
    });
  });

  describe("Admin Transfer", () => {
    it("should allow admin to initiate admin transfer", () => {
      const { result } = simnet.callPublicFn(
        "bitpay-access-control",
        "initiate-admin-transfer",
        [Cl.principal(address1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should not allow non-admin to initiate admin transfer", () => {
      const { result } = simnet.callPublicFn(
        "bitpay-access-control",
        "initiate-admin-transfer",
        [Cl.principal(address2)],
        address1 // Non-admin
      );
      expect(result).toBeErr(Cl.uint(4001)); // ERR_UNAUTHORIZED
    });
  });

  describe("Error Handling", () => {
    it("should reject invalid role IDs", () => {
      const { result } = simnet.callPublicFn(
        "bitpay-access-control",
        "grant-role",
        [Cl.uint(99), Cl.principal(address1)], // Invalid role
        deployer
      );
      expect(result).toBeErr(Cl.uint(4002)); // ERR_INVALID_ROLE
    });

    it("should not grant role if user already has it", () => {
      // Grant role first time
      simnet.callPublicFn(
        "bitpay-access-control",
        "grant-role",
        [Cl.uint(OPERATOR_ROLE), Cl.principal(address1)],
        deployer
      );

      // Try to grant same role again
      const { result } = simnet.callPublicFn(
        "bitpay-access-control",
        "grant-role",
        [Cl.uint(OPERATOR_ROLE), Cl.principal(address1)],
        deployer
      );
      expect(result).toBeErr(Cl.uint(4001)); // ERR_UNAUTHORIZED
    });
  });

  describe("Multiple Roles", () => {
    it("should allow users to have multiple roles", () => {
      // Grant multiple roles to same user
      simnet.callPublicFn(
        "bitpay-access-control",
        "grant-role",
        [Cl.uint(OPERATOR_ROLE), Cl.principal(address1)],
        deployer
      );
      simnet.callPublicFn(
        "bitpay-access-control",
        "grant-role",
        [Cl.uint(TREASURY_ROLE), Cl.principal(address1)],
        deployer
      );

      // Check both roles
      const hasOperator = simnet.callReadOnlyFn(
        "bitpay-access-control",
        "has-role",
        [Cl.uint(OPERATOR_ROLE), Cl.principal(address1)],
        deployer
      );
      expect(hasOperator.result).toBeBool(true);

      const hasTreasury = simnet.callReadOnlyFn(
        "bitpay-access-control",
        "has-role",
        [Cl.uint(TREASURY_ROLE), Cl.principal(address1)],
        deployer
      );
      expect(hasTreasury.result).toBeBool(true);
    });

    it("should allow revoking one role while keeping others", () => {
      // Grant multiple roles
      simnet.callPublicFn(
        "bitpay-access-control",
        "grant-role",
        [Cl.uint(OPERATOR_ROLE), Cl.principal(address1)],
        deployer
      );
      simnet.callPublicFn(
        "bitpay-access-control",
        "grant-role",
        [Cl.uint(TREASURY_ROLE), Cl.principal(address1)],
        deployer
      );

      // Revoke one role
      simnet.callPublicFn(
        "bitpay-access-control",
        "revoke-role",
        [Cl.uint(OPERATOR_ROLE), Cl.principal(address1)],
        deployer
      );

      // Check that operator role is gone but treasury remains
      const hasOperator = simnet.callReadOnlyFn(
        "bitpay-access-control",
        "has-role",
        [Cl.uint(OPERATOR_ROLE), Cl.principal(address1)],
        deployer
      );
      expect(hasOperator.result).toBeBool(false);

      const hasTreasury = simnet.callReadOnlyFn(
        "bitpay-access-control",
        "has-role",
        [Cl.uint(TREASURY_ROLE), Cl.principal(address1)],
        deployer
      );
      expect(hasTreasury.result).toBeBool(true);
    });
  });
});
