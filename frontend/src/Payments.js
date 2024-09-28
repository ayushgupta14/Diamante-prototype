import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
// import '/Payment.css'

function Payments() {
  const [receiverPublicKey, setReceiverPublicKey] = useState('');
  const [senderLocation, setSenderLocation] = useState('');
  const [receiverLocation, setReceiverLocation] = useState('');
  const [senderCurrency, setSenderCurrency] = useState('USD');
  const [receiverCurrency, setReceiverCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [convertedAmount, setConvertedAmount] = useState(0); // DIAM equivalent of sender's amount
  const [paymentMessage, setPaymentMessage] = useState('');
  const [walletAvailable, setWalletAvailable] = useState({
    diamWallet: false,
    metaMask: false,
  });
  const [walletConnected, setWalletConnected] = useState('');
  const [senderPublicKey, setSenderPublicKey] = useState('');
  const [senderSecret, setSenderSecret] = useState("");
  const [metaMaskAccount, setMetaMaskAccount] = useState('');
  const [web3, setWeb3] = useState(null);

  // Static conversion rates (you can replace these with real-time data if needed)
  const conversionRates = {
    USD: 1,
    EUR: 1.1,
    INR: 80,
  };

  const DIAM_RATE_PER_USD = 12.5; // DIAM coins per 1 USD

  // Mapping locations (countries) to currencies
  const locationCurrencyMap = {
    USA: 'USD',
    India: 'INR',
    EU: 'EUR',
    // Add more locations and their corresponding currencies as needed
  };

  useEffect(() => {
    const checkWallets = () => {
      if (window.diam) {
        setWalletAvailable((prevState) => ({ ...prevState, diamWallet: true }));
      }

      if (window.ethereum) {
        setWalletAvailable((prevState) => ({ ...prevState, metaMask: true }));
      }
    };

    checkWallets();
  }, []);

  const connectDiamWallet = async () => {
    try {
      if (walletConnected !== 'MetaMask') {
        const connection = await window.diam.connect();
        const publicKey = connection.message[0].diamPublicKey;
        setSenderPublicKey(publicKey);
        setWalletConnected('Diam');
      }
    } catch (error) {
      console.error('Error connecting to Diam Wallet:', error);
      setPaymentMessage('Error connecting to Diam Wallet.');
    }
  };

  const connectToMetaWallet = async () => {
    try {
      if (walletConnected !== 'Diam') {
        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.enable();
        setWeb3(web3Instance);
        const accounts = await web3Instance.eth.getAccounts();
        setMetaMaskAccount(accounts[0]);
        setWalletConnected('MetaMask');
      }
    } catch (error) {
      console.error(`Error initializing Web3: ${error.message}`);
    }
  };

  // Currency conversion logic
  const convertToDIAM = (amount, currency) => {
    const usdAmount = amount / conversionRates[currency]; // Convert from local currency to USD
    const diamAmount = usdAmount * DIAM_RATE_PER_USD; // Convert USD to DIAM
    return diamAmount.toFixed(2); // Round to 2 decimal places
  };

  const handleAmountChange = (e) => {
    const amountEntered = e.target.value;
    setAmount(amountEntered);
    const diamEquivalent = convertToDIAM(amountEntered, senderCurrency); // Convert based on sender's currency
    setConvertedAmount(diamEquivalent); // Update DIAM equivalent
  };

  const handleSenderLocationChange = (e) => {
    const location = e.target.value;
    setSenderLocation(location);
    setSenderCurrency(locationCurrencyMap[location]); // Automatically set sender's currency based on location
    const diamEquivalent = convertToDIAM(amount, locationCurrencyMap[location]);
    setConvertedAmount(diamEquivalent); 
  };

  const handleReceiverLocationChange = (e) => {
    const location = e.target.value;
    setReceiverLocation(location);
    setReceiverCurrency(locationCurrencyMap[location]); 
  };

  const makePayment = async () => {
    try {
  
      const xdrResponse = await fetch('http://localhost:3001/create-payment-xdr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderPublicKey,     
          receiverPublicKey,    
          amount: convertedAmount, 
        }),
      });
      const { xdr } = await xdrResponse.json();
  
      
      const signedXDR = await window.diam.sign(xdr, true, 'Diamante Testnet');
      console.log('Signed XDR:', signedXDR);
  
      const submitResponse = await fetch('http://localhost:3001/submit-signed-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedXDR }),
      });
      const data = await submitResponse.json();
      setPaymentMessage(data.message);
    } catch (error) {
      console.error('Error making payment:', error);
      setPaymentMessage('Error making payment.');
    }
  };
  

  const makeManualPayment = async () => {
    try {
      const response = await fetch('http://localhost:3001/make-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderSecret, 
          receiverPublicKey,
          amount: convertedAmount,
        }),
      });
      const data = await response.json();
      setPaymentMessage(data.message);
    } catch (error) {
      console.error('Error making payment:', error);
      setPaymentMessage('Error making payment.');
    }
  };

  return (
    <div className="App">
      <h1>Payments</h1>

      <section className="wallet-info">
        {walletAvailable.diamWallet && !walletConnected && (
          <>
            <h2>Diam Wallet Detected</h2>
            <button className='button-wl' onClick={connectDiamWallet}>Connect To Diam Wallet</button>
          </>
        )}

        {walletAvailable.metaMask && !walletConnected && (
          <>
            <h2>MetaMask Detected</h2>
            <button className='button-wl' onClick={connectToMetaWallet}>Connect To MetaMask</button>
          </>
        )}

        {walletConnected === 'Diam' && (
          <>
            <h2>Connected to Diam Wallet</h2>
            <p>Account: {senderPublicKey}</p>
          </>
        )}

        {walletConnected === 'MetaMask' && (
          <>
            <h2>Connected to MetaMask</h2>
            <p>Account: {metaMaskAccount}</p>
          </>
        )}
      </section>

      {walletConnected && (
        <section>
          <h2>Make a Payment</h2>

          
          <div>
            <label htmlFor="senderLocation">Sender's Location: </label>
            <select id="senderLocation" value={senderLocation} onChange={handleSenderLocationChange}>
              <option value="USA">USA</option>
              <option value="India">India</option>
              <option value="EU">EU</option>
              
            </select>
          </div>

          <div>
            <label htmlFor="senderCurrency">Sender's Currency: </label>
            <input type="text" value={senderCurrency} readOnly />
          </div>

          <input
            type="text"
            placeholder="sender's secret key"
            value={senderSecret}
            onChange={(e) => setSenderSecret(e.target.value)}
          />

          
          <input
            type="text"
            placeholder="Receiver's Public Key"
            value={receiverPublicKey}
            onChange={(e) => setReceiverPublicKey(e.target.value)}
          />

          <div>
            <label htmlFor="receiverLocation">Receiver's Location: </label>
            <select id="receiverLocation" value={receiverLocation} onChange={handleReceiverLocationChange}>
              <option value="USA">USA</option>
              <option value="India">India</option>
              <option value="EU">EU</option>
              
            </select>
          </div>

          <div>
            <label htmlFor="receiverCurrency">Receiver's Currency: </label>
            <input type="text" value={receiverCurrency} readOnly />
          </div>

          <input
            type="text"
            placeholder="Amount"
            value={amount}
            onChange={handleAmountChange}
          />

          <p>Equivalent in DIAM: {convertedAmount}</p>

          <button className='button-wl' onClick={makeManualPayment}>Make Payment</button>
          <p>{paymentMessage}</p>
        </section>
      )}
    </div>
  );
}

export default Payments;

