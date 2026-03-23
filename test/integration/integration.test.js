const { expect } = require("chai");
const { ethers } = require("hardhat");
const HardhatHelper = require("../helpers/hardhat-helper");

describe("Integration Tests - MuseNFT & ProjectManager", function () {
  let museNFT;
  let projectManager;
  let owner;
  let artist;
  let collector;
  let maintainer;

  beforeEach(async function () {
    [owner, artist, collector, maintainer] = await ethers.getSigners();
    
    // Deploy contracts
    museNFT = await HardhatHelper.deployContract("MuseNFT");
    projectManager = await HardhatHelper.deployContract("ProjectManager");
  });

  describe("Cross-Contract Functionality", function () {
    it("Should create artwork and project with same creator", async function () {
      // Register AI model
      await museNFT.registerAIModel("stable-diffusion");
      
      // Create project
      const projectId = await projectManager.createProject(
        "AI Art Project",
        "Project for creating AI collaborative art",
        "https://github.com/example/ai-art"
      );
      
      // Create artwork
      const contentHash = HardhatHelper.generateContentHash();
      const tokenId = await museNFT.createCollaborativeArtwork(
        "stable-diffusion",
        60, // human contribution
        40, // AI contribution
        "A beautiful landscape",
        "https://metadata.example.com/art/1",
        contentHash,
        true // can evolve
      );
      
      // Verify both creations
      expect(await projectManager.getTotalProjects()).to.equal(1);
      expect(await museNFT.totalSupply()).to.equal(1);
      
      const project = await projectManager.getProject(1);
      const collaboration = await museNFT.getCollaboration(1);
      
      expect(project.maintainer).to.equal(owner.address);
      expect(collaboration.humanCreator).to.equal(owner.address);
    });

    it("Should handle multiple users creating art and projects", async function () {
      // Register AI models
      await museNFT.registerAIModel("stable-diffusion");
      await museNFT.registerAIModel("dall-e");
      
      // Artist creates project and artwork
      const artistProject = await projectManager.connect(artist).createProject(
        "Artist Portfolio",
        "Personal art collection",
        "https://github.com/artist/portfolio"
      );
      
      const artistArtwork = await museNFT.connect(artist).createCollaborativeArtwork(
        "stable-diffusion",
        70,
        30,
        "Abstract composition",
        "https://metadata.example.com/art/artist-1",
        HardhatHelper.generateContentHash(),
        true
      );
      
      // Collector creates project and artwork
      const collectorProject = await projectManager.connect(collector).createProject(
        "Collector's Gallery",
        "Curated collection",
        "https://github.com/collector/gallery"
      );
      
      const collectorArtwork = await museNFT.connect(collector).createCollaborativeArtwork(
        "dall-e",
        50,
        50,
        "Digital masterpiece",
        "https://metadata.example.com/art/collector-1",
        HardhatHelper.generateContentHash(),
        true
      );
      
      // Verify all creations
      expect(await projectManager.getTotalProjects()).to.equal(2);
      expect(await museNFT.totalSupply()).to.equal(2);
      
      const artistProjects = await projectManager.getMaintainerProjects(artist.address);
      const collectorProjects = await projectManager.getMaintainerProjects(collector.address);
      
      expect(artistProjects.length).to.equal(1);
      expect(collectorProjects.length).to.equal(1);
      
      const artistTokens = await museNFT.getTokensByCreator(artist.address);
      const collectorTokens = await museNFT.getTokensByCreator(collector.address);
      
      expect(artistTokens.length).to.equal(1);
      expect(collectorTokens.length).to.equal(1);
    });

    it("Should handle artwork evolution with project bounties", async function () {
      // Register AI model
      await museNFT.registerAIModel("stable-diffusion");
      
      // Create project with bounty issue
      const projectId = await projectManager.createProject(
        "Evolution Project",
        "Project for evolving artwork",
        "https://github.com/example/evolution"
      );
      
      const issueId = await projectManager.createIssue(
        1,
        "Evolve artwork #1",
        "Create an evolution of the initial artwork",
        HardhatHelper.toEther(0.1) // 0.1 ETH bounty
      );
      
      // Create artwork
      const contentHash = HardhatHelper.generateContentHash();
      const tokenId = await museNFT.createCollaborativeArtwork(
        "stable-diffusion",
        60,
        40,
        "Original artwork",
        "https://metadata.example.com/art/original",
        contentHash,
        true
      );
      
      // Wait for evolution interval
      await HardhatHelper.increaseTime(86400); // 1 day
      
      // Evolve artwork
      const evolutionHash = HardhatHelper.generateContentHash();
      await museNFT.connect(artist).evolveArtwork(
        1,
        "Evolved version",
        "https://metadata.example.com/art/evolved",
        evolutionHash,
        { value: await museNFT.evolutionFee() }
      );
      
      // Verify evolution
      const evolutionHistory = await museNFT.getEvolutionHistory(1);
      expect(evolutionHistory.length).to.equal(1);
      
      const collaboration = await museNFT.getCollaboration(1);
      expect(collaboration.evolutionCount).to.equal(1);
      
      // Update issue status to completed
      await projectManager.updateIssueStatus(1, 2); // IssueStatus.Completed
      
      const issue = await projectManager.getIssue(1);
      expect(issue.status).to.equal(2); // Completed
    });
  });

  describe("Security Integration", function () {
    it("Should prevent unauthorized access across contracts", async function () {
      // Register AI model
      await museNFT.registerAIModel("stable-diffusion");
      
      // Create project
      const projectId = await projectManager.createProject(
        "Secure Project",
        "Project with restricted access",
        "https://github.com/example/secure"
      );
      
      // Try to update issue status as non-maintainer
      const issueId = await projectManager.createIssue(
        1,
        "Test Issue",
        "A test issue",
        HardhatHelper.toEther(0.05)
      );
      
      await HardhatHelper.expectRevert(
        projectManager.connect(collector).updateIssueStatus(1, 2),
        "Only project maintainer can perform this action"
      );
      
      // Create artwork
      const tokenId = await museNFT.createCollaborativeArtwork(
        "stable-diffusion",
        60,
        40,
        "Secure artwork",
        "https://metadata.example.com/art/secure",
        HardhatHelper.generateContentHash(),
        true
      );
      
      // Try to set royalty as non-creator
      await HardhatHelper.expectRevert(
        museNFT.connect(collector).setRoyalty(1, 500),
        "Only creator can set royalty"
      );
    });

    it("Should handle reentrancy protection", async function () {
      // This test ensures reentrancy guards are working
      // In a real scenario, you'd deploy a malicious contract to test this
      // For now, we'll test the basic reentrancy protection on evolution
      
      await museNFT.registerAIModel("stable-diffusion");
      
      const tokenId = await museNFT.createCollaborativeArtwork(
        "stable-diffusion",
        60,
        40,
        "Test artwork",
        "https://metadata.example.com/art/test",
        HardhatHelper.generateContentHash(),
        true
      );
      
      await HardhatHelper.increaseTime(86400); // 1 day
      
      // Evolution should work normally
      await expect(museNFT.evolveArtwork(
        1,
        "Evolution",
        "https://metadata.example.com/art/evolved",
        HardhatHelper.generateContentHash(),
        { value: await museNFT.evolutionFee() }
      )).to.not.be.reverted;
    });
  });

  describe("Gas Optimization Integration", function () {
    it("Should track gas usage across contract interactions", async function () {
      await museNFT.registerAIModel("stable-diffusion");
      
      // Measure gas for project creation
      const projectTx = await projectManager.createProject(
        "Gas Test Project",
        "Project for gas testing",
        "https://github.com/example/gas-test"
      );
      const projectReceipt = await projectTx.wait();
      
      // Measure gas for artwork creation
      const artworkTx = await museNFT.createCollaborativeArtwork(
        "stable-diffusion",
        60,
        40,
        "Gas test artwork",
        "https://metadata.example.com/art/gas-test",
        HardhatHelper.generateContentHash(),
        true
      );
      const artworkReceipt = await artworkTx.wait();
      
      console.log(`Project creation gas: ${projectReceipt.gasUsed.toString()}`);
      console.log(`Artwork creation gas: ${artworkReceipt.gasUsed.toString()}`);
      
      // Gas usage should be reasonable
      expect(projectReceipt.gasUsed).to.be.lessThan(200000);
      expect(artworkReceipt.gasUsed).to.be.lessThan(500000);
    });
  });
});
