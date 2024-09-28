const express = require('express');
const cors = require('cors');
const DiamSdk = require('diamnet-sdk');

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

const server = new DiamSdk.Aurora.Server("https://diamtestnet.diamcircle.io");

app.post('/make-payment', async (req, res) => {
  try {
    const { senderSecret, receiverPublicKey, amount } = req.body;
    const sourceKeys = DiamSdk.Keypair.fromSecret(senderSecret);

    await server.loadAccount(receiverPublicKey).catch((error) => {
      if (error instanceof DiamSdk.NotFoundError) {
        throw new Error('The destination account does not exist!');
      }
      return error;
    });

    const sourceAccount = await server.loadAccount(sourceKeys.publicKey());

    const transaction = new DiamSdk.TransactionBuilder(sourceAccount, {
      fee: DiamSdk.BASE_FEE, // Using SDK's base fee
      networkPassphrase: DiamSdk.Networks.TESTNET,
    })
      .addOperation(
        DiamSdk.Operation.payment({
          destination: receiverPublicKey,
          asset: DiamSdk.Asset.native(), // Sending DIAM
          amount: amount,
        })
      )
      .addMemo(DiamSdk.Memo.text('Test Transaction')) // Optional: Add a memo
      .setTimeout(180)
      .build();

    transaction.sign(sourceKeys);


    const result = await server.submitTransaction(transaction);

    console.log('Payment made successfully:', result);
    res.json({ message: `Payment of ${amount} DIAM to ${receiverPublicKey} successful!`, result });
  } catch (error) {
    console.error('Error in make-payment:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/create-payment-xdr', async (req, res) => {
  try {
    const { senderPublicKey, receiverPublicKey, amount } = req.body;
    const server = DiamSdk.Aurora.Server('https://diamtestnet.diamcircle.io');

    const account = await server.loadAccount(senderPublicKey);

    const transaction = new DiamSdk.TransactionBuilder(account, {
      fee: await server.fetchBaseFee(),
      networkPassphrase: DiamSdk.Networks.TESTNET,
    })
      .addOperation(
        DiamSdk.Operation.payment({
          destination: receiverPublicKey,
          asset: DiamSdk.Asset.native(),
          amount: amount,
        })
      )
      .addMemo(DiamSdk.Memo.text('Test Transaction')) 
      .setTimeout(180)
      .build();

    res.json({ xdr: transaction.toXDR() });
  } catch (error) {
    console.error('Error in create-payment-xdr:', error);
    res.status(500).json({ error: error.message });
  }
});
app.post('/submit-signed-transaction', async (req, res) => {
  try {
    const { signedXDR } = req.body;
    const server = DiamSdk.Aurora.Server('https://diamtestnet.diamcircle.io');

    const transaction = DiamSdk.TransactionBuilder.fromXDR(signedXDR, DiamSdk.Networks.TESTNET);

    const result = await server.submitTransaction(transaction);
    console.log('Transaction successfully submitted', result);

    res.json({ message: 'Transaction successfully submitted', result });
  } catch (error) {
    console.error('Error in submit-signed-transaction:', error);
    res.status(500).json({ error: error.message });
  }
});


app.listen(port, () => {
  console.log(`Diamante backend listening at http://localhost:${port}`);
});
