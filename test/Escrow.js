const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Escrow", () => {
  let buyer, seller, inspector, lender;
  let realEstate, escrow;

  beforeEach(async () => {
    // Setup accounts
    [buyer, seller, inspector, lender] = await ethers.getSigners();

    // Deploy Real Estate
    const RealEstate = await ethers.getContractFactory("RealEstate");
    realEstate = await RealEstate.deploy();

    // Mint
    let mintTransaction = await realEstate
      .connect(seller)
      .mint(
        "https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS/.json"
      );
    await mintTransaction.wait();

    console.log(`mint id: ${mintTransaction.nonce}`);

    // Deploy Escrow
    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(
      realEstate.address,
      seller.address,
      inspector.address,
      lender.address
    );

    // Seller approves property
    const sellerApproval = await realEstate
      .connect(seller)
      .approve(escrow.address, 0);
    await sellerApproval.wait();

    const listTransaction = await escrow
      .connect(seller)
      .list(0, buyer.address, tokens(10), tokens(5));
    await listTransaction.wait();
  });

  describe("Deployment", () => {
    it("Returns NFT address", async () => {
      const result = await escrow.nftAddress();
      expect(result).to.be.equal(realEstate.address);
    });

    it("Returns seller", async () => {
      const result = await escrow.seller();
      expect(result).to.be.equal(seller.address);
    });

    it("Returns inspector", async () => {
      const result = await escrow.inspector();
      expect(result).to.be.equal(inspector.address);
    });

    it("Returns lender", async () => {
      const result = await escrow.lender();
      expect(result).to.be.equal(lender.address);
    });
  });

  describe("Listing", () => {
    it("Updates as listed", async () => {
      const result = await escrow.isListed(0);
      expect(result).to.be.equal(true);
    });
    it("Updates ownership", async () => {
      expect(await realEstate.ownerOf(0)).to.be.equal(escrow.address);
    });
    it("Returns buyer", async () => {
      const result = await escrow.buyer(0);
      expect(result).to.be.equal(buyer.address);
    });
    it("Returns purchase price", async () => {
      const result = await escrow.purchasePrice(0);
      expect(result).to.be.equal(tokens(10));
    });
    it("Returns escrow amount", async () => {
      const result = await escrow.escrowAmount(0);
      expect(result).to.be.equal(tokens(5));
    });
  });
});
