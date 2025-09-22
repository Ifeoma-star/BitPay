
import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const address3 = accounts.get("wallet_3")!;

// sBTC multisig address for minting in tests
const SBTC_DEPLOYER = "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4";

describe("BitPay Core Stream Management Contract", () => {
  
  // Setup roles for core contract testing
  const setupRoles = () => {
    // Grant manage-streams role to wallet_1 so it can create streams
    simnet.callPublicFn(
      "bitpay-access-control",
      "grant-role",
      [Cl.uint(5), Cl.principal(address1)], // STREAM_MANAGER_ROLE
      deployer
    );
    
    // Grant manage-streams role to wallet_2 for testing
    simnet.callPublicFn(
      "bitpay-access-control",
      "grant-role",
      [Cl.uint(5), Cl.principal(address2)], // STREAM_MANAGER_ROLE
      deployer
    );
  };
  
  describe("Contract Initialization", () => {
    it("should have correct initial configuration", () => {
      const { result } = simnet.callReadOnlyFn(
        "bitpay-core",
        "get-contract-config",
        [],
        deployer
      );
      
      expect(result).toBeTuple({
        "min-stream-amount": Cl.uint(546),
        "max-stream-amount": Cl.uint(10000000000),
        "min-duration": Cl.uint(1),
        "max-duration": Cl.uint(525600),
        "max-streams-per-user": Cl.uint(1000),
        "default-fee-rate": Cl.uint(100),
        "max-fee-rate": Cl.uint(1000),
        "treasury-address": Cl.principal(deployer)
      });
    });

    it("should have correct global stats initially", () => {
      const { result } = simnet.callReadOnlyFn(
        "bitpay-core",
        "get-global-stats",
        [],
        deployer
      );
      
      expect(result).toBeTuple({
        "total-streams": Cl.uint(0),
        "total-volume": Cl.uint(0),
        "contract-version": Cl.uint(1),
        "contract-paused": Cl.bool(false),
        "default-fee-rate": Cl.uint(100)
      });
    });
  });

  describe("Stream Creation", () => {
    it("should create a stream successfully with valid parameters", () => {
      // Setup roles first
      setupRoles();
      
      // Check initial sBTC balance (automatically funded by Clarinet 2.15+)
      const balance = simnet.callReadOnlyFn(
        "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token",
        "get-balance",
        [Cl.principal(address1)],
        address1
      );
      // Wallet should have sBTC already funded

      // Create stream
      const { result } = simnet.callPublicFn(
        "bitpay-core",
        "create-stream",
        [
          Cl.principal(address2), // recipient
          Cl.uint(1000),         // total-amount (1000 sats)
          Cl.uint(10),           // duration-blocks
          Cl.uint(0),            // start-delay-blocks
          Cl.stringUtf8("Test stream") // metadata
        ],
        address1
      );
      
      expect(result).toBeOk(Cl.uint(1)); // First stream ID
    });

    it("should reject stream with amount below minimum", () => {
      setupRoles();
      const { result } = simnet.callPublicFn(
        "bitpay-core",
        "create-stream",
        [
          Cl.principal(address2),
          Cl.uint(500), // Below 546 sats minimum
          Cl.uint(10),
          Cl.uint(0),
          Cl.stringUtf8("Invalid stream")
        ],
        address1
      );
      
      expect(result).toBeErr(Cl.uint(5003)); // ERR_INVALID_AMOUNT
    });

    it("should reject stream with zero duration", () => {
      setupRoles();
      const { result } = simnet.callPublicFn(
        "bitpay-core",
        "create-stream",
        [
          Cl.principal(address2),
          Cl.uint(1000),
          Cl.uint(0), // Zero duration
          Cl.uint(0),
          Cl.stringUtf8("Invalid stream")
        ],
        address1
      );
      
      expect(result).toBeErr(Cl.uint(5004)); // ERR_INVALID_DURATION
    });

    it("should reject stream to self", () => {
      setupRoles();
      const { result } = simnet.callPublicFn(
        "bitpay-core",
        "create-stream",
        [
          Cl.principal(address1), // Same as sender
          Cl.uint(1000),
          Cl.uint(10),
          Cl.uint(0),
          Cl.stringUtf8("Self stream")
        ],
        address1
      );
      
      expect(result).toBeErr(Cl.uint(5005)); // ERR_INVALID_RECIPIENT
    });
  });

  describe("Stream Information", () => {
    it("should return stream details correctly", () => {
      // Setup: sBTC is auto-funded, create a stream
      setupRoles();

      simnet.callPublicFn(
        "bitpay-core",
        "create-stream",
        [
          Cl.principal(address2),
          Cl.uint(1000),
          Cl.uint(10),
          Cl.uint(0),
          Cl.stringUtf8("Test stream")
        ],
        address1
      );

      // Get stream details
      const { result } = simnet.callReadOnlyFn(
        "bitpay-core",
        "get-stream",
        [Cl.uint(1)],
        deployer
      );
      
      expect(result).toBeSome(Cl.tuple({}));
    });

    it("should return none for non-existent stream", () => {
      const { result } = simnet.callReadOnlyFn(
        "bitpay-core",
        "get-stream",
        [Cl.uint(999)],
        deployer
      );
      
      expect(result).toBeNone();
    });
  });

  describe("Stream Claiming", () => {
    it("should allow recipient to claim available funds", () => {
      // Setup: sBTC is auto-funded, create a stream
      setupRoles();

      simnet.callPublicFn(
        "bitpay-core",
        "create-stream",
        [
          Cl.principal(address2),
          Cl.uint(1000),
          Cl.uint(10),
          Cl.uint(0),
          Cl.stringUtf8("Test stream")
        ],
        address1
      );

      // Mine some blocks to make funds claimable
      simnet.mineBlock([]);
      simnet.mineBlock([]);
      simnet.mineBlock([]);
      simnet.mineBlock([]);
      simnet.mineBlock([]);

      // Claim stream
      const { result } = simnet.callPublicFn(
        "bitpay-core",
        "claim-stream",
        [Cl.uint(1)],
        address2
      );
      
      expect(result).toBeOk(Cl.uint(450)); // Expected claimable amount
    });

    it("should reject claim from non-recipient", () => {
      // Setup: sBTC is auto-funded, create a stream
      setupRoles();

      simnet.callPublicFn(
        "bitpay-core",
        "create-stream",
        [
          Cl.principal(address2),
          Cl.uint(1000),
          Cl.uint(10),
          Cl.uint(0),
          Cl.stringUtf8("Test stream")
        ],
        address1
      );

      // Try to claim from wrong address
      const { result } = simnet.callPublicFn(
        "bitpay-core",
        "claim-stream",
        [Cl.uint(1)],
        address3 // Not the recipient
      );
      
      expect(result).toBeErr(Cl.uint(5001)); // ERR_UNAUTHORIZED
    });
  });

  describe("Stream Cancellation", () => {
    it("should allow sender to cancel stream", () => {
      // Setup: sBTC is auto-funded, create a stream
      setupRoles();

      simnet.callPublicFn(
        "bitpay-core",
        "create-stream",
        [
          Cl.principal(address2),
          Cl.uint(1000),
          Cl.uint(10),
          Cl.uint(0),
          Cl.stringUtf8("Test stream")
        ],
        address1
      );

      // Cancel stream
      const { result } = simnet.callPublicFn(
        "bitpay-core",
        "cancel-stream",
        [Cl.uint(1)],
        address1
      );
      
      expect(result).toBeOk(Cl.tuple({
        "recipient-amount": Cl.uint(0),
        "refunded-amount": Cl.uint(990)
      }));
    });

    it("should reject cancellation from non-sender", () => {
      // Setup: sBTC is auto-funded, create a stream
      setupRoles();

      simnet.callPublicFn(
        "bitpay-core",
        "create-stream",
        [
          Cl.principal(address2),
          Cl.uint(1000),
          Cl.uint(10),
          Cl.uint(0),
          Cl.stringUtf8("Test stream")
        ],
        address1
      );

      // Try to cancel from wrong address
      const { result } = simnet.callPublicFn(
        "bitpay-core",
        "cancel-stream",
        [Cl.uint(1)],
        address3 // Not the sender
      );
      
      expect(result).toBeErr(Cl.uint(5001)); // ERR_UNAUTHORIZED
    });
  });

  describe("Stream Pause/Resume", () => {
    it("should allow sender to pause stream", () => {
      // Setup: sBTC is auto-funded, create a stream
      setupRoles();

      simnet.callPublicFn(
        "bitpay-core",
        "create-stream",
        [
          Cl.principal(address2),
          Cl.uint(1000),
          Cl.uint(100),
          Cl.uint(0),
          Cl.stringUtf8("Test stream")
        ],
        address1
      );

      // Pause stream
      const { result } = simnet.callPublicFn(
        "bitpay-core",
        "pause-stream",
        [Cl.uint(1)],
        address1
      );
      
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should allow sender to resume paused stream", () => {
      // Setup: sBTC is auto-funded, create a stream
      setupRoles();

      simnet.callPublicFn(
        "bitpay-core",
        "create-stream",
        [
          Cl.principal(address2),
          Cl.uint(1000),
          Cl.uint(100),
          Cl.uint(0),
          Cl.stringUtf8("Test stream")
        ],
        address1
      );

      // Pause stream first
      simnet.callPublicFn(
        "bitpay-core",
        "pause-stream",
        [Cl.uint(1)],
        address1
      );

      // Mine some blocks
      simnet.mineBlock([]);
      simnet.mineBlock([]);
      simnet.mineBlock([]);
      simnet.mineBlock([]);
      simnet.mineBlock([]);

      // Resume stream
      const { result } = simnet.callPublicFn(
        "bitpay-core",
        "resume-stream",
        [Cl.uint(1)],
        address1
      );
      
      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Claimable Amount Calculation", () => {
    it("should calculate correct claimable amount", () => {
      // Setup: sBTC is auto-funded, create a stream
      setupRoles();

      simnet.callPublicFn(
        "bitpay-core",
        "create-stream",
        [
          Cl.principal(address2),
          Cl.uint(1000),
          Cl.uint(10),
          Cl.uint(0),
          Cl.stringUtf8("Test stream")
        ],
        address1
      );

      // Mine 5 blocks (half the duration)
      simnet.mineBlock([]);
      simnet.mineBlock([]);
      simnet.mineBlock([]);
      simnet.mineBlock([]);
      simnet.mineBlock([]);

      // Calculate claimable amount
      const { result } = simnet.callReadOnlyFn(
        "bitpay-core",
        "calculate-claimable-amount",
        [Cl.uint(1), Cl.uint(0)],
        deployer
      );
      
      expect(result).toBeTuple({});
    });
  });

  describe("Stream Progress", () => {
    it("should calculate stream progress correctly", () => {
      // Setup: sBTC is auto-funded, create a stream
      setupRoles();

      simnet.callPublicFn(
        "bitpay-core",
        "create-stream",
        [
          Cl.principal(address2),
          Cl.uint(1000),
          Cl.uint(10),
          Cl.uint(0),
          Cl.stringUtf8("Test stream")
        ],
        address1
      );

      // Mine 5 blocks (half the duration)
      simnet.mineBlock([]);
      simnet.mineBlock([]);
      simnet.mineBlock([]);
      simnet.mineBlock([]);
      simnet.mineBlock([]);

      // Calculate progress
      const { result } = simnet.callReadOnlyFn(
        "bitpay-core",
        "calculate-stream-progress",
        [Cl.uint(1)],
        deployer
      );
      
      expect(result).toBeUint(5000); // 50% in basis points
    });
  });
});
