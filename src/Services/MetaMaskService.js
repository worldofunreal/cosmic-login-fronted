// src/services/MetaMaskService.js

class MetaMaskService {
      async isMetaMaskInstalled() {
          console.log('Checking if MetaMask is installed...');
          const isInstalled = typeof window.ethereum !== 'undefined';
          console.log('MetaMask is installed:', isInstalled);
          return isInstalled;
      }
  
      async getEthereumAddress() {
          console.log('Getting Ethereum address...');
          if (!this.isMetaMaskInstalled()) {
              throw new Error("MetaMask is not installed");
          }
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          console.log('Ethereum address:', accounts[0]);
          return accounts[0]; // Returns the first account
      }
  
      async signMessage(message) {
          console.log('Signing message...');
          if (!this.isMetaMaskInstalled()) {
              throw new Error("MetaMask is not installed");
          }
          const ethereumAddress = await this.getEthereumAddress();
          console.log('Ethereum address for signing:', ethereumAddress);
          // Convert message to hex format
          const messageHex = Buffer.from(message).toString('hex');
          console.log('Message hex:', messageHex);
          // Requests MetaMask to sign the hexlified message
          const signature = await window.ethereum.request({
              method: 'personal_sign',
              params: [messageHex, ethereumAddress],
          });
          console.log('Signature:', signature);
          return signature; // Returns the signature
      }
      
  }
  
  export default new MetaMaskService();
  