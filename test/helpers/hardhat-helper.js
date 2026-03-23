const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * Helper utilities for Hardhat testing
 */
class HardhatHelper {
  /**
   * Deploy a contract with verification
   */
  static async deployContract(contractName, constructorArgs = []) {
    const ContractFactory = await ethers.getContractFactory(contractName);
    const contract = await ContractFactory.deploy(...constructorArgs);
    await contract.waitForDeployment();
    return contract;
  }

  /**
   * Get contract address
   */
  static async getContractAddress(contract) {
    return await contract.getAddress();
  }

  /**
   * Calculate gas cost
   */
  static calculateGasCost(gasUsed, gasPrice) {
    return ethers.formatEther(BigInt(gasUsed) * BigInt(gasPrice));
  }

  /**
   * Get current timestamp
   */
  static async getCurrentTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
  }

  /**
   * Increase time
   */
  static async increaseTime(seconds) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine");
  }

  /**
   * Set next block timestamp
   */
  static async setNextBlockTimestamp(timestamp) {
    await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp]);
  }

  /**
   * Get balance in ether
   */
  static async getBalance(address) {
    const balance = await ethers.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  /**
   * Generate random content hash
   */
  static generateContentHash() {
    return ethers.keccak256(ethers.toUtf8Bytes(Math.random().toString()));
  }

  /**
   * Generate random string
   */
  static randomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Expect revert with custom message
   */
  static async expectRevert(promise, expectedError) {
    await expect(promise).to.be.revertedWith(expectedError);
  }

  /**
   * Expect event emission
   */
  static async expectEvent(contract, eventName, ...args) {
    await expect(contract).to.emit(contract, eventName).withArgs(...args);
  }

  /**
   * Convert ether to wei
   */
  static toEther(amount) {
    return ethers.parseEther(amount.toString());
  }

  /**
   * Convert wei to ether
   */
  static fromEther(amount) {
    return ethers.formatEther(amount);
  }
}

module.exports = HardhatHelper;
