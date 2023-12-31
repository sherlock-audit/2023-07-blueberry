// SPDX-License-Identifier: MIT
/*
██████╗ ██╗     ██╗   ██╗███████╗██████╗ ███████╗██████╗ ██████╗ ██╗   ██╗
██╔══██╗██║     ██║   ██║██╔════╝██╔══██╗██╔════╝██╔══██╗██╔══██╗╚██╗ ██╔╝
██████╔╝██║     ██║   ██║█████╗  ██████╔╝█████╗  ██████╔╝██████╔╝ ╚████╔╝
██╔══██╗██║     ██║   ██║██╔══╝  ██╔══██╗██╔══╝  ██╔══██╗██╔══██╗  ╚██╔╝
██████╔╝███████╗╚██████╔╝███████╗██████╔╝███████╗██║  ██║██║  ██║   ██║
╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝
*/

pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./BaseOracleExt.sol";
import "../utils/BlueBerryErrors.sol" as Errors;
import "../interfaces/IBaseOracle.sol";

/// @title AggregatorOracle
/// @author BlueberryProtocol
/// @notice This contract aggregates price feeds from multiple oracle sources, 
///         ensuring a more reliable and resilient price data.
contract AggregatorOracle is IBaseOracle, Ownable, BaseOracleExt {

    /*//////////////////////////////////////////////////////////////////////////
                                      PUBLIC STORAGE 
    //////////////////////////////////////////////////////////////////////////*/

    /// @notice Mapping of primary oracle sources associated with each token.
    mapping(address => uint256) public primarySourceCount;
    /// @notice Mapping from token to (mapping from index to oracle source)
    mapping(address => mapping(uint256 => IBaseOracle)) public primarySources;
    //// @notice Maximum allowed price deviation between oracle sources, expressed in base 10000.
    mapping(address => uint256) public maxPriceDeviations;

    /*//////////////////////////////////////////////////////////////////////////
                                      EVENTS 
    //////////////////////////////////////////////////////////////////////////*/

    /// @notice Emitted when primary oracle sources are set or updated for a token.
    /// @param token Address of the token whose oracle sources were updated.
    /// @param maxPriceDeviation Maximum allowed price deviation.
    /// @param oracles List of oracle sources set for the token.
    event SetPrimarySources(
        address indexed token,
        uint256 maxPriceDeviation,
        IBaseOracle[] oracles
    );

    /*//////////////////////////////////////////////////////////////////////////
                                      FUNCTIONS
    //////////////////////////////////////////////////////////////////////////*/

    /// @notice Set primary oracle sources for given token
    /// @dev Emit SetPrimarySources event when primary oracles set successfully
    /// @param token Token to set oracle sources
    /// @param maxPriceDeviation Maximum price deviation (in 1e18) of price feeds
    /// @param sources Oracle sources for the token
    function _setPrimarySources(
        address token,
        uint256 maxPriceDeviation,
        IBaseOracle[] memory sources
    ) internal {
        // Validate inputs
        if (token == address(0)) revert Errors.ZERO_ADDRESS();
        if (maxPriceDeviation > Constants.MAX_PRICE_DEVIATION)
            revert Errors.OUT_OF_DEVIATION_CAP(maxPriceDeviation);
        if (sources.length > 3) revert Errors.EXCEED_SOURCE_LEN(sources.length);

        primarySourceCount[token] = sources.length;
        maxPriceDeviations[token] = maxPriceDeviation;
        for (uint256 idx = 0; idx < sources.length; idx++) {
            if (address(sources[idx]) == address(0))
                revert Errors.ZERO_ADDRESS();
            primarySources[token][idx] = sources[idx];
        }
        emit SetPrimarySources(token, maxPriceDeviation, sources);
    }

    /// @notice Set primary oracle sources for the given token
    /// @dev Only owner can set primary sources
    /// @param token Token address to set oracle sources
    /// @param maxPriceDeviation Maximum price deviation (in 1e18) of price feeds
    /// @param sources Oracle sources for the token
    function setPrimarySources(
        address token,
        uint256 maxPriceDeviation,
        IBaseOracle[] memory sources
    ) external onlyOwner {
        _setPrimarySources(token, maxPriceDeviation, sources);
    }

    /// @notice Set or update the primary oracle sources for multiple tokens at once.
    /// Can only be called by the contract owner.
    /// @param tokens List of token addresses.
    /// @param maxPriceDeviationList List of maximum allowed price deviations (in 1e18).
    /// @param allSources list of oracle sources, one list for each token.
    function setMultiPrimarySources(
        address[] memory tokens,
        uint256[] memory maxPriceDeviationList,
        IBaseOracle[][] memory allSources
    ) external onlyOwner {
        // Validate inputs
        if (
            tokens.length != allSources.length ||
            tokens.length != maxPriceDeviationList.length
        ) revert Errors.INPUT_ARRAY_MISMATCH();

        for (uint256 idx = 0; idx < tokens.length; idx++) {
            _setPrimarySources(
                tokens[idx],
                maxPriceDeviationList[idx],
                allSources[idx]
            );
        }
    }

    /// @notice Fetch the aggregated USD price of a token.
    /// If there are multiple valid sources, the function aggregates
    /// and ensures the data is within acceptable deviation limits.
    /// @param token Address of the token to fetch the price for.
    /// @return The aggregated USD price of the token, scaled by 10**18.
    function getPrice(address token) external override returns (uint256) {
        uint256 candidateSourceCount = primarySourceCount[token];
        if (candidateSourceCount == 0) revert Errors.NO_PRIMARY_SOURCE(token);
        uint256[] memory prices = new uint256[](candidateSourceCount);

        /// Get valid oracle sources
        uint256 validSourceCount = 0;
        for (uint256 idx = 0; idx < candidateSourceCount; idx++) {
            try primarySources[token][idx].getPrice(token) returns (
                uint256 px
            ) {
                if (px != 0) prices[validSourceCount++] = px;
            } catch {}
        }
        if (validSourceCount == 0) revert Errors.NO_VALID_SOURCE(token);
        /// Sort prices in ascending order
        for (uint256 i = 0; i < validSourceCount - 1; i++) {
            for (uint256 j = 0; j < validSourceCount - i - 1; j++) {
                if (prices[j] > prices[j + 1]) {
                    (prices[j], prices[j + 1]) = (prices[j + 1], prices[j]);
                }
            }
        }
        uint256 maxPriceDeviation = maxPriceDeviations[token];

        /// Algo:
        /// - 1 valid source --> return price
        /// - 2 valid sources
        ///     --> if the prices within deviation threshold, return average
        ///     --> else revert
        /// - 3 valid sources --> check deviation threshold of each pair
        ///     --> if all within threshold, return median
        ///     --> if one pair within threshold, return average of the pair
        ///     --> if none, revert
        /// - revert Errors.otherwise
        if (validSourceCount == 1) {
            return prices[0]; // if 1 valid source, return
        } else if (validSourceCount == 2) {
            if (!_isValidPrices(prices[0], prices[1], maxPriceDeviation))
                revert Errors.EXCEED_DEVIATION();
            return (prices[0] + prices[1]) / 2; /// if 2 valid sources, return average
        } else {
            bool midMinOk = _isValidPrices(
                prices[0],
                prices[1],
                maxPriceDeviation
            );
            bool maxMidOk = _isValidPrices(
                prices[1],
                prices[2],
                maxPriceDeviation
            );
            if (midMinOk && maxMidOk) {
                return prices[1]; /// if 3 valid sources, and each pair is within thresh, return median
            } else if (midMinOk) {
                return (prices[0] + prices[1]) / 2; /// return average of pair within thresh
            } else if (maxMidOk) {
                return (prices[1] + prices[2]) / 2; /// return average of pair within thresh
            } else {
                revert Errors.EXCEED_DEVIATION();
            }
        }
    }
}
