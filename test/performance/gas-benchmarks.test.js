const { expect } = require("chai");
const { ethers } = require("hardhat");
const HardhatHelper = require("../helpers/hardhat-helper");

describe("Gas Benchmarks", function () {
  let museNFT;
  let projectManager;
  let owner;
  let artist;
  let collector;

  beforeEach(async function () {
    [owner, artist, collector] = await ethers.getSigners();
    
    museNFT = await HardhatHelper.deployContract("MuseNFT");
    projectManager = await HardhatHelper.deployContract("ProjectManager");
  });

  describe("MuseNFT Gas Usage", function () {
    it("should benchmark AI model registration", async function () {
      const tx = await museNFT.registerAIModel("stable-diffusion");
      const receipt = await tx.wait();
      
      console.log(`AI Model Registration Gas: ${receipt.gasUsed.toString()}`);
      
      // Should be under 50,000 gas
      expect(receipt.gasUsed).to.be.lessThan(50000);
    });

    it("should benchmark collaborative artwork creation", async function () {
      await museNFT.registerAIModel("stable-diffusion");
      
      const tx = await museNFT.createCollaborativeArtwork(
        "stable-diffusion",
        60,
        40,
        "A beautiful landscape",
        "https://metadata.example.com/art/1",
        HardhatHelper.generateContentHash(),
        true
      );
      
      const receipt = await tx.wait();
      console.log(`Artwork Creation Gas: ${receipt.gasUsed.toString()}`);
      
      // Should be under 300,000 gas
      expect(receipt.gasUsed).to.be.lessThan(300000);
    });

    it("should benchmark artwork evolution", async function () {
      await museNFT.registerAIModel("stable-diffusion");
      
      // Create artwork first
      await museNFT.createCollaborativeArtwork(
        "stable-diffusion",
        60,
        40,
        "Original artwork",
        "https://metadata.example.com/art/1",
        HardhatHelper.generateContentHash(),
        true
      );
      
      // Wait for evolution interval
      await HardhatHelper.increaseTime(86400); // 1 day
      
      const evolutionFee = await museNFT.evolutionFee();
      const tx = await museNFT.evolveArtwork(
        1,
        "Evolved version",
        "https://metadata.example.com/art/evolved",
        HardhatHelper.generateContentHash(),
        { value: evolutionFee }
      );
      
      const receipt = await tx.wait();
      console.log(`Artwork Evolution Gas: ${receipt.gasUsed.toString()}`);
      
      // Should be under 200,000 gas
      expect(receipt.gasUsed).to.be.lessThan(200000);
    });

    it("should benchmark royalty setting", async function () {
      await museNFT.registerAIModel("stable-diffusion");
      
      await museNFT.createCollaborativeArtwork(
        "stable-diffusion",
        60,
        40,
        "Test artwork",
        "https://metadata.example.com/art/1",
        HardhatHelper.generateContentHash(),
        true
      );
      
      const tx = await museNFT.setRoyalty(1, 500); // 5%
      const receipt = await tx.wait();
      
      console.log(`Royalty Setting Gas: ${receipt.gasUsed.toString()}`);
      
      // Should be under 30,000 gas
      expect(receipt.gasUsed).to.be.lessThan(30000);
    });

    it("should benchmark batch operations", async function () {
      await museNFT.registerAIModel("stable-diffusion");
      await museNFT.registerAIModel("dall-e");
      await museNFT.registerAIModel("midjourney");
      
      const gasUsages = [];
      
      // Create multiple artworks
      for (let i = 0; i < 5; i++) {
        const tx = await museNFT.createCollaborativeArtwork(
          "stable-diffusion",
          50 + i * 10,
          50 - i * 10,
          `Artwork ${i + 1}`,
          `https://metadata.example.com/art/${i + 1}`,
          HardhatHelper.generateContentHash(),
          true
        );
        const receipt = await tx.wait();
        gasUsages.push(receipt.gasUsed.toNumber());
      }
      
      const avgGas = gasUsages.reduce((a, b) => a + b, 0) / gasUsages.length;
      console.log(`Average Artwork Creation Gas: ${avgGas.toString()}`);
      
      // Average should be consistent
      gasUsages.forEach(gas => {
        expect(gas).to.be.closeTo(avgGas, 20000); // Within 20,000 gas variance
      });
    });
  });

  describe("ProjectManager Gas Usage", function () {
    it("should benchmark project creation", async function () {
      const tx = await projectManager.createProject(
        "Test Project",
        "A test project for gas benchmarking",
        "https://github.com/test/project"
      );
      
      const receipt = await tx.wait();
      console.log(`Project Creation Gas: ${receipt.gasUsed.toString()}`);
      
      // Should be under 150,000 gas
      expect(receipt.gasUsed).to.be.lessThan(150000);
    });

    it("should benchmark issue creation", async function () {
      await projectManager.createProject(
        "Test Project",
        "A test project for gas benchmarking",
        "https://github.com/test/project"
      );
      
      const tx = await projectManager.createIssue(
        1,
        "Test Issue",
        "An issue for testing gas usage",
        HardhatHelper.toEther(0.1)
      );
      
      const receipt = await tx.wait();
      console.log(`Issue Creation Gas: ${receipt.gasUsed.toString()}`);
      
      // Should be under 100,000 gas
      expect(receipt.gasUsed).to.be.lessThan(100000);
    });

    it("should benchmark issue status update", async function () {
      await projectManager.createProject(
        "Test Project",
        "A test project for gas benchmarking",
        "https://github.com/test/project"
      );
      
      await projectManager.createIssue(
        1,
        "Test Issue",
        "An issue for testing gas usage",
        HardhatHelper.toEther(0.1)
      );
      
      const tx = await projectManager.updateIssueStatus(1, 2); // InProgress
      const receipt = await tx.wait();
      
      console.log(`Issue Status Update Gas: ${receipt.gasUsed.toString()}`);
      
      // Should be under 50,000 gas
      expect(receipt.gasUsed).to.be.lessThan(50000);
    });

    it("should benchmark multiple project operations", async function () {
      const gasUsages = [];
      
      // Create multiple projects
      for (let i = 0; i < 3; i++) {
        const tx = await projectManager.createProject(
          `Project ${i + 1}`,
          `Description for project ${i + 1}`,
          `https://github.com/test/project${i + 1}`
        );
        const receipt = await tx.wait();
        gasUsages.push(receipt.gasUsed.toNumber());
      }
      
      const avgGas = gasUsages.reduce((a, b) => a + b, 0) / gasUsages.length;
      console.log(`Average Project Creation Gas: ${avgGas.toString()}`);
      
      // Gas usage should be consistent
      gasUsages.forEach(gas => {
        expect(gas).to.be.closeTo(avgGas, 10000); // Within 10,000 gas variance
      });
    });
  });

  describe("Cross-Contract Gas Usage", function () {
    it("should benchmark full workflow", async function () {
      const totalGas = [];
      
      // Register AI model
      let tx = await museNFT.registerAIModel("stable-diffusion");
      let receipt = await tx.wait();
      totalGas.push(receipt.gasUsed.toNumber());
      
      // Create project
      tx = await projectManager.createProject(
        "AI Art Project",
        "Project for collaborative AI art",
        "https://github.com/example/ai-art"
      );
      receipt = await tx.wait();
      totalGas.push(receipt.gasUsed.toNumber());
      
      // Create issue
      tx = await projectManager.createIssue(
        1,
        "Create masterpiece",
        "Create a collaborative AI masterpiece",
        HardhatHelper.toEther(0.5)
      );
      receipt = await tx.wait();
      totalGas.push(receipt.gasUsed.toNumber());
      
      // Create artwork
      tx = await museNFT.createCollaborativeArtwork(
        "stable-diffusion",
        70,
        30,
        "AI masterpiece",
        "https://metadata.example.com/art/masterpiece",
        HardhatHelper.generateContentHash(),
        true
      );
      receipt = await tx.wait();
      totalGas.push(receipt.gasUsed.toNumber());
      
      // Wait and evolve
      await HardhatHelper.increaseTime(86400);
      
      const evolutionFee = await museNFT.evolutionFee();
      tx = await museNFT.evolveArtwork(
        1,
        "Enhanced masterpiece",
        "https://metadata.example.com/art/enhanced",
        HardhatHelper.generateContentHash(),
        { value: evolutionFee }
      );
      receipt = await tx.wait();
      totalGas.push(receipt.gasUsed.toNumber());
      
      // Update issue status
      tx = await projectManager.updateIssueStatus(1, 3); // Completed
      receipt = await tx.wait();
      totalGas.push(receipt.gasUsed.toNumber());
      
      const totalWorkflowGas = totalGas.reduce((a, b) => a + b, 0);
      console.log(`Total Workflow Gas: ${totalWorkflowGas.toString()}`);
      console.log(`Workflow Steps Gas: ${totalGas.join(', ')}`);
      
      // Total workflow should be under 1M gas
      expect(totalWorkflowGas).to.be.lessThan(1000000);
    });
  });

  describe("Gas Optimization Targets", function () {
    it("should meet gas optimization targets", async function () {
      await museNFT.registerAIModel("stable-diffusion");
      
      // Test artwork creation with different parameters
      const scenarios = [
        { human: 100, ai: 0, name: "100% Human" },
        { human: 50, ai: 50, name: "50/50 Split" },
        { human: 0, ai: 100, name: "100% AI" },
      ];
      
      for (const scenario of scenarios) {
        const tx = await museNFT.createCollaborativeArtwork(
          "stable-diffusion",
          scenario.human,
          scenario.ai,
          `Test artwork - ${scenario.name}`,
          "https://metadata.example.com/art/test",
          HardhatHelper.generateContentHash(),
          true
        );
        
        const receipt = await tx.wait();
        console.log(`${scenario.name} Creation Gas: ${receipt.gasUsed.toString()}`);
        
        // All scenarios should be under 300,000 gas
        expect(receipt.gasUsed).to.be.lessThan(300000);
      }
    });
  });
});
