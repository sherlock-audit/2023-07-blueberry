import chai, { expect } from "chai";
import { BigNumber, utils } from "ethers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ADDRESS, CONTRACT_NAMES } from "../../constant";
import { ChainlinkAdapterOracle, IFeedRegistry } from "../../typechain-types";
import ChainlinkFeedABI from "../../abi/IFeedRegistry.json";

import { near } from "../assertions/near";
import { roughlyNear } from "../assertions/roughlyNear";

chai.use(near);
chai.use(roughlyNear);

const OneDay = 86400;

describe("Chainlink Adapter Oracle", () => {
  let admin: SignerWithAddress;
  let alice: SignerWithAddress;
  let chainlinkAdapterOracle: ChainlinkAdapterOracle;
  let chainlinkFeedOracle: IFeedRegistry;
  before(async () => {
    [admin, alice] = await ethers.getSigners();
    chainlinkFeedOracle = <IFeedRegistry>(
      await ethers.getContractAt(ChainlinkFeedABI, ADDRESS.ChainlinkRegistry)
    );
  });

  beforeEach(async () => {
    const ChainlinkAdapterOracle = await ethers.getContractFactory(
      CONTRACT_NAMES.ChainlinkAdapterOracle
    );
    chainlinkAdapterOracle = <ChainlinkAdapterOracle>(
      await ChainlinkAdapterOracle.deploy(ADDRESS.ChainlinkRegistry)
    );
    await chainlinkAdapterOracle.deployed();

    await chainlinkAdapterOracle.setTimeGap(
      [ADDRESS.USDC, ADDRESS.UNI],
      [OneDay, OneDay]
    );
  });

  describe("Constructor", () => {
    it("should revert when feed registry address is invalid", async () => {
      const ChainlinkAdapterOracle = await ethers.getContractFactory(
        CONTRACT_NAMES.ChainlinkAdapterOracle
      );
      await expect(
        ChainlinkAdapterOracle.deploy(ethers.constants.AddressZero)
      ).to.be.revertedWithCustomError(ChainlinkAdapterOracle, "ZERO_ADDRESS");
    });
    it("should set feed registry", async () => {
      expect(await chainlinkAdapterOracle.registry()).to.be.equal(
        ADDRESS.ChainlinkRegistry
      );
    });
  });
  describe("Owner", () => {
    it("should be able to set feed registry", async () => {
      await expect(
        chainlinkAdapterOracle
          .connect(alice)
          .setFeedRegistry(ADDRESS.ChainlinkRegistry)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        chainlinkAdapterOracle.setFeedRegistry(ethers.constants.AddressZero)
      ).to.be.revertedWithCustomError(chainlinkAdapterOracle, "ZERO_ADDRESS");

      await expect(
        chainlinkAdapterOracle.setFeedRegistry(ADDRESS.ChainlinkRegistry)
      )
        .to.be.emit(chainlinkAdapterOracle, "SetRegistry")
        .withArgs(ADDRESS.ChainlinkRegistry);

      expect(await chainlinkAdapterOracle.registry()).to.be.equal(
        ADDRESS.ChainlinkRegistry
      );
    });
    it("should be able to set maxDelayTimes", async () => {
      await expect(
        chainlinkAdapterOracle
          .connect(alice)
          .setTimeGap([ADDRESS.USDC, ADDRESS.UNI], [OneDay, OneDay])
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        chainlinkAdapterOracle.setTimeGap(
          [ADDRESS.USDC, ADDRESS.UNI],
          [OneDay, OneDay, OneDay]
        )
      ).to.be.revertedWithCustomError(
        chainlinkAdapterOracle,
        "INPUT_ARRAY_MISMATCH"
      );

      await expect(
        chainlinkAdapterOracle.setTimeGap(
          [ADDRESS.USDC, ADDRESS.UNI],
          [OneDay, OneDay * 3]
        )
      )
        .to.be.revertedWithCustomError(chainlinkAdapterOracle, "TOO_LONG_DELAY")
        .withArgs(OneDay * 3);

      await expect(
        chainlinkAdapterOracle.setTimeGap(
          [ADDRESS.USDC, ethers.constants.AddressZero],
          [OneDay, OneDay]
        )
      ).to.be.revertedWithCustomError(chainlinkAdapterOracle, "ZERO_ADDRESS");

      await expect(
        chainlinkAdapterOracle.setTimeGap(
          [ADDRESS.USDC, ADDRESS.UNI],
          [OneDay, OneDay]
        )
      ).to.be.emit(chainlinkAdapterOracle, "SetTimeGap");

      expect(await chainlinkAdapterOracle.timeGaps(ADDRESS.USDC)).to.be.equal(
        OneDay
      );
    });
    it("should be able to set setTokenRemappings", async () => {
      await expect(
        chainlinkAdapterOracle
          .connect(alice)
          .setTokenRemappings(
            [ADDRESS.USDC, ADDRESS.UNI],
            [ADDRESS.USDC, ADDRESS.UNI]
          )
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        chainlinkAdapterOracle.setTokenRemappings(
          [ADDRESS.USDC, ADDRESS.UNI],
          [ADDRESS.USDC, ADDRESS.UNI, ADDRESS.UNI]
        )
      ).to.be.revertedWithCustomError(
        chainlinkAdapterOracle,
        "INPUT_ARRAY_MISMATCH"
      );

      await expect(
        chainlinkAdapterOracle.setTokenRemappings(
          [ADDRESS.USDC, ethers.constants.AddressZero],
          [ADDRESS.USDC, ADDRESS.UNI]
        )
      ).to.be.revertedWithCustomError(chainlinkAdapterOracle, "ZERO_ADDRESS");

      await expect(
        chainlinkAdapterOracle.setTokenRemappings(
          [ADDRESS.USDC],
          [ADDRESS.USDC]
        )
      ).to.be.emit(chainlinkAdapterOracle, "SetTokenRemapping");

      expect(
        await chainlinkAdapterOracle.remappedTokens(ADDRESS.USDC)
      ).to.be.equal(ADDRESS.USDC);
    });
  });

  describe("Price Feeds", () => {
    it("should revert when max delay time is not set", async () => {
      await expect(chainlinkAdapterOracle.callStatic.getPrice(ADDRESS.CRV))
        .to.be.revertedWithCustomError(chainlinkAdapterOracle, "NO_MAX_DELAY")
        .withArgs(ADDRESS.CRV);
    });
    it("USDC price feeds / based 10^18", async () => {
      const decimals = await chainlinkFeedOracle.decimals(
        ADDRESS.USDC,
        ADDRESS.CHAINLINK_USD
      );
      const { answer } = await chainlinkFeedOracle.latestRoundData(
        ADDRESS.USDC,
        ADDRESS.CHAINLINK_USD
      );
      const price = await chainlinkAdapterOracle.callStatic.getPrice(
        ADDRESS.USDC
      );

      expect(
        answer
          .mul(BigNumber.from(10).pow(18))
          .div(BigNumber.from(10).pow(decimals))
      ).to.be.roughlyNear(price);

      // real usdc price should be closed to $1
      expect(price).to.be.roughlyNear(BigNumber.from(10).pow(18));
      console.log("USDC Price:", utils.formatUnits(price, 18));
    });
    it("UNI price feeds / based 10^18", async () => {
      const decimals = await chainlinkFeedOracle.decimals(
        ADDRESS.UNI,
        ADDRESS.CHAINLINK_USD
      );
      const uniData = await chainlinkFeedOracle.latestRoundData(
        ADDRESS.UNI,
        ADDRESS.CHAINLINK_USD
      );
      const price = await chainlinkAdapterOracle.callStatic.getPrice(
        ADDRESS.UNI
      );

      expect(
        uniData.answer
          .mul(BigNumber.from(10).pow(18))
          .div(BigNumber.from(10).pow(decimals))
      ).to.be.roughlyNear(price);
      console.log("UNI Price:", utils.formatUnits(price, 18));
    });
    it("CRV price feeds", async () => {
      await chainlinkAdapterOracle.setTimeGap([ADDRESS.CRV], [OneDay]);
      await chainlinkAdapterOracle.setTokenRemappings(
        [ADDRESS.CRV],
        [ADDRESS.CRV]
      );
      const price = await chainlinkAdapterOracle.callStatic.getPrice(
        ADDRESS.CRV
      );
      console.log("CRV Price:", utils.formatUnits(price, 18));
    });
    it("should revert for too old prices", async () => {
      const dydx = "0x92D6C1e31e14520e676a687F0a93788B716BEff5";
      await chainlinkAdapterOracle.setTimeGap([dydx], [3600]);
      await expect(chainlinkAdapterOracle.callStatic.getPrice(dydx))
        .to.be.revertedWithCustomError(chainlinkAdapterOracle, "PRICE_OUTDATED")
        .withArgs(dydx);
    });
    it("should revert for invalid feeds", async () => {
      await chainlinkAdapterOracle.setTimeGap([ADDRESS.ICHI], [OneDay]);
      await expect(
        chainlinkAdapterOracle.callStatic.getPrice(ADDRESS.ICHI)
      ).to.be.revertedWith("Feed not found");
    });
  });
});
