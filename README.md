
# Blueberry Update #3 contest details

- Join [Sherlock Discord](https://discord.gg/MABEWyASkp)
- Submit findings using the issue page in your private contest repo (label issues as med or high)
- [Read for more details](https://docs.sherlock.xyz/audits/watsons)

# Q&A

### Q: On what chains are the smart contracts going to be deployed?
mainnet, arbitrum
___

### Q: Which ERC20 tokens do you expect will interact with the smart contracts? 
Whitelisted
___

### Q: Which ERC721 tokens do you expect will interact with the smart contracts? 
Uni-v LP tokens, whitelisted
___

### Q: Which ERC777 tokens do you expect will interact with the smart contracts? 
none
___

### Q: Are there any FEE-ON-TRANSFER tokens interacting with the smart contracts?

none
___

### Q: Are there any REBASING tokens interacting with the smart contracts?

none
___

### Q: Are the admins of the protocols your contracts integrate with (if any) TRUSTED or RESTRICTED?
Trusted
___

### Q: Is the admin/owner of the protocol/contracts TRUSTED or RESTRICTED?
Trusted
___

### Q: Are there any additional protocol roles? If yes, please explain in detail:
none
___

### Q: Is the code/contract expected to comply with any EIPs? Are there specific assumptions around adhering to those EIPs that Watsons should be aware of?
none
___

### Q: Please list any known issues/acceptable risks that should not result in a valid finding.
- Rebasing tokens, tokens that change balance on transfer, with token burns, etc, are not compatible with the system and should not be whitelisted.

- Centralization risk is known: the DAO multi-sig for the protocol is able to set the various configurations for the protocol. 
___

### Q: Please provide links to previous audits (if any).
Sherlock audit - 
https://github.com/sherlock-audit/2023-02-blueberry-judging/issues
https://github.com/sherlock-audit/2023-04-blueberry-judging/issues/
https://github.com/sherlock-audit/2023-05-blueberry-judging/issues/

Hacken Audit - 
https://hacken.io/audits/blueberry-protocol/
___

### Q: Are there any off-chain mechanisms or off-chain procedures for the protocol (keeper bots, input validation expectations, etc)?
none
___

### Q: In case of external protocol integrations, are the risks of external contracts pausing or executing an emergency withdrawal acceptable? If not, Watsons will submit issues related to these situations that can harm your protocol's functionality.
Yes.
___

### Q: Do you expect to use any of the following tokens with non-standard behaviour with the smart contracts?
none
___

### Q: Add links to relevant protocol resources
https://docs.blueberry.garden/
___



# Audit scope


[blueberry-core @ 4c6a45fac5d109b81889e883757b6ab92c1e55ea](https://github.com/Blueberryfi/blueberry-core/tree/4c6a45fac5d109b81889e883757b6ab92c1e55ea)
- [blueberry-core/contracts/BlueBerryBank.sol](blueberry-core/contracts/BlueBerryBank.sol)
- [blueberry-core/contracts/FeeManager.sol](blueberry-core/contracts/FeeManager.sol)
- [blueberry-core/contracts/ProtocolConfig.sol](blueberry-core/contracts/ProtocolConfig.sol)
- [blueberry-core/contracts/libraries/BBMath.sol](blueberry-core/contracts/libraries/BBMath.sol)
- [blueberry-core/contracts/libraries/FixedPointMathLib.sol](blueberry-core/contracts/libraries/FixedPointMathLib.sol)
- [blueberry-core/contracts/libraries/Paraswap/PSwapLib.sol](blueberry-core/contracts/libraries/Paraswap/PSwapLib.sol)
- [blueberry-core/contracts/libraries/Paraswap/Utils.sol](blueberry-core/contracts/libraries/Paraswap/Utils.sol)
- [blueberry-core/contracts/libraries/UniV3/UniV3WrappedLib.sol](blueberry-core/contracts/libraries/UniV3/UniV3WrappedLib.sol)
- [blueberry-core/contracts/libraries/balancer/FixedPoint.sol](blueberry-core/contracts/libraries/balancer/FixedPoint.sol)
- [blueberry-core/contracts/spell/AuraSpell.sol](blueberry-core/contracts/spell/AuraSpell.sol)
- [blueberry-core/contracts/spell/BasicSpell.sol](blueberry-core/contracts/spell/BasicSpell.sol)
- [blueberry-core/contracts/spell/ConvexSpell.sol](blueberry-core/contracts/spell/ConvexSpell.sol)
- [blueberry-core/contracts/spell/IchiSpell.sol](blueberry-core/contracts/spell/IchiSpell.sol)
- [blueberry-core/contracts/spell/ShortLongSpell.sol](blueberry-core/contracts/spell/ShortLongSpell.sol)
- [blueberry-core/contracts/utils/BlueBerryConst.sol](blueberry-core/contracts/utils/BlueBerryConst.sol)
- [blueberry-core/contracts/utils/BlueBerryErrors.sol](blueberry-core/contracts/utils/BlueBerryErrors.sol)
- [blueberry-core/contracts/utils/ERC1155NaiveReceiver.sol](blueberry-core/contracts/utils/ERC1155NaiveReceiver.sol)
- [blueberry-core/contracts/utils/EnsureApprove.sol](blueberry-core/contracts/utils/EnsureApprove.sol)
- [blueberry-core/contracts/vault/HardVault.sol](blueberry-core/contracts/vault/HardVault.sol)
- [blueberry-core/contracts/vault/SoftVault.sol](blueberry-core/contracts/vault/SoftVault.sol)
- [blueberry-core/contracts/wrapper/WAuraPools.sol](blueberry-core/contracts/wrapper/WAuraPools.sol)
- [blueberry-core/contracts/wrapper/WConvexPools.sol](blueberry-core/contracts/wrapper/WConvexPools.sol)
- [blueberry-core/contracts/wrapper/WERC20.sol](blueberry-core/contracts/wrapper/WERC20.sol)
- [blueberry-core/contracts/wrapper/WIchiFarm.sol](blueberry-core/contracts/wrapper/WIchiFarm.sol)
- [blueberry-core/contracts/oracle/AggregatorOracle.sol](blueberry-core/contracts/oracle/AggregatorOracle.sol)
- [blueberry-core/contracts/oracle/BandAdapterOracle.sol](blueberry-core/contracts/oracle/BandAdapterOracle.sol)
- [blueberry-core/contracts/oracle/BaseAdapter.sol](blueberry-core/contracts/oracle/BaseAdapter.sol)
- [blueberry-core/contracts/oracle/BaseOracleExt.sol](blueberry-core/contracts/oracle/BaseOracleExt.sol)
- [blueberry-core/contracts/oracle/ChainlinkAdapterOracle.sol](blueberry-core/contracts/oracle/ChainlinkAdapterOracle.sol)
- [blueberry-core/contracts/oracle/ChainlinkAdapterOracleL2.sol](blueberry-core/contracts/oracle/ChainlinkAdapterOracleL2.sol)
- [blueberry-core/contracts/oracle/CompStableBPTOracle.sol](blueberry-core/contracts/oracle/CompStableBPTOracle.sol)
- [blueberry-core/contracts/oracle/CoreOracle.sol](blueberry-core/contracts/oracle/CoreOracle.sol)
- [blueberry-core/contracts/oracle/CurveBaseOracle.sol](blueberry-core/contracts/oracle/CurveBaseOracle.sol)
- [blueberry-core/contracts/oracle/CurveStableOracle.sol](blueberry-core/contracts/oracle/CurveStableOracle.sol)
- [blueberry-core/contracts/oracle/CurveTricryptoOracle.sol](blueberry-core/contracts/oracle/CurveTricryptoOracle.sol)
- [blueberry-core/contracts/oracle/CurveVolatileOracle.sol](blueberry-core/contracts/oracle/CurveVolatileOracle.sol)
- [blueberry-core/contracts/oracle/IchiVaultOracle.sol](blueberry-core/contracts/oracle/IchiVaultOracle.sol)
- [blueberry-core/contracts/oracle/StableBPTOracle.sol](blueberry-core/contracts/oracle/StableBPTOracle.sol)
- [blueberry-core/contracts/oracle/UniswapV2Oracle.sol](blueberry-core/contracts/oracle/UniswapV2Oracle.sol)
- [blueberry-core/contracts/oracle/UniswapV3AdapterOracle.sol](blueberry-core/contracts/oracle/UniswapV3AdapterOracle.sol)
- [blueberry-core/contracts/oracle/UsingBaseOracle.sol](blueberry-core/contracts/oracle/UsingBaseOracle.sol)
- [blueberry-core/contracts/oracle/WeightedBPTOracle.sol](blueberry-core/contracts/oracle/WeightedBPTOracle.sol)
- [blueberry-core/contracts/libraries/UniV3/UniV3WrappedLibContainer.sol](blueberry-core/contracts/libraries/UniV3/UniV3WrappedLibContainer.sol)



