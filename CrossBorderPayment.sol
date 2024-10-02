// SPDX-License-Identifier: MIT
pragma solidity ^0.5.1;

import "./AggregatorV3Interface.sol";

contract CrossBorderPayment {
    address public owner;
    AggregatorV3Interface internal priceFeedETHUSD;
    uint256 public usdToINR;

    mapping(address => mapping(bytes32 => uint128)) public balances;
    bytes32[] public supportedCurrencies;

    event Deposit(address indexed user, uint256 amount, bytes32 currency);
    event Withdrawal(address indexed user, uint256 amount, bytes32 currency);
    event CrossBorderPaymentSent(address indexed sender, address indexed receiver, uint256 amount, bytes32 fromCurrency, bytes32 toCurrency);
    event ExchangeRatesUpdated(uint256 usdToINR);
    event CurrencyAdded(bytes32 currency);

    constructor() public {
        owner = msg.sender;
        priceFeedETHUSD = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
        supportedCurrencies.push(stringToBytes32("INR"));
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function getLatestETHUSDPrice() public view returns (uint256) {
        (, int256 price, , , ) = priceFeedETHUSD.latestRoundData();
        return uint256(price);
    }

    function updateExchangeRateINR(uint256 _usdToINR) public onlyOwner {
        usdToINR = _usdToINR;
        emit ExchangeRatesUpdated(usdToINR);
    }

    function addSupportedCurrency(string memory currency) public onlyOwner {
        supportedCurrencies.push(stringToBytes32(currency));
        emit CurrencyAdded(stringToBytes32(currency));
    }

    function getLatestETHINRPrice() public view returns (uint256) {
        uint256 ethUSD = getLatestETHUSDPrice();
        require(ethUSD > 0, "ETH to USD price must be greater than 0");
        return (ethUSD * usdToINR) / 1e8;
    }

    function isSupportedCurrency(string memory currency) internal view returns (bool) {
        bytes32 currencyBytes = stringToBytes32(currency);
        for (uint256 i = 0; i < supportedCurrencies.length; i++) {
            if (supportedCurrencies[i] == currencyBytes) {
                return true;
            }
        }
        return false;
    }

    function deposit(string memory currency) public payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        require(isSupportedCurrency(currency), "Unsupported currency");

        uint256 exchangeRate = getExchangeRate(currency);
        require(exchangeRate > 0, "Invalid exchange rate");

        uint256 amountInCurrency = (msg.value * exchangeRate) / 1 ether;
        balances[msg.sender][stringToBytes32(currency)] += uint128(amountInCurrency);
        emit Deposit(msg.sender, amountInCurrency, stringToBytes32(currency));
    }

    function withdraw(uint256 amount, string memory currency) public {
        require(balances[msg.sender][stringToBytes32(currency)] >= amount, "Insufficient balance");

        uint256 exchangeRate = getExchangeRate(currency);
        uint256 amountETH = (amount * 1 ether) / exchangeRate;

        balances[msg.sender][stringToBytes32(currency)] -= uint128(amount);
        msg.sender.transfer(amountETH);
        emit Withdrawal(msg.sender, amount, stringToBytes32(currency));
    }

    function getExchangeRate(string memory currency) internal view returns (uint256) {
        if (compareStrings(currency, "INR")) {
            uint256 ethINR = getLatestETHINRPrice();
            require(ethINR > 0, "ETH to INR price must be greater than 0");
            return ethINR;
        }
        return 0;
    }

    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    // Correct fallback function for Solidity 0.5.x
    function() external payable {}

    // Proper stringToBytes32 function
    function stringToBytes32(string memory source) internal pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }
        assembly {
            result := mload(add(source, 32))
        }
    }
}

