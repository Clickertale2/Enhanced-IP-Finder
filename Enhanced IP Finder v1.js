// Name: Enhanced IP Finder
// ID: enhancedIPAddressExtension
// Description: Retrieves and displays local and external IP addresses.
// By: -Clickertale_2- <https://scratch.mit.edu/users/-Clickertale_2-/>
// License: MIT AND MPL-2.0

(function(Scratch) {
  'use strict';

  // Check if the extension is running unsandboxed
  if (!Scratch.extensions.unsandboxed) {
    throw new Error('Enhanced IP Finder must run unsandboxed');
  }

class EnhancedIPAddressExtension {
  constructor() {
    this.peerConnection = null; // Store the RTCPeerConnection instance
    this.ips = new Set(); // Use a Set to ensure unique IPs
    this.ports = new Set(); // Use a Set to ensure unique ports
    this.candidates = new Set(); // Use a Set for unique candidate information
    this.timeout = 5; // Default timeout in seconds
  }

  getInfo() {
    return {
      id: 'enhancedIPAddressExtension',
      name: 'Enhanced IP Finder',
      color1: '#4CAF50',
      color2: '#388E3C',
      color3: '#2E7D32',
      blocks: [
        {
          opcode: 'getAllIPAddresses',
          blockType: Scratch.BlockType.REPORTER,
          text: 'get all IP addresses',
        },
        {
          opcode: 'getIPv4Addresses',
          blockType: Scratch.BlockType.REPORTER,
          text: 'get IPv4 addresses',
        },
        {
          opcode: 'getIPv6Addresses',
          blockType: Scratch.BlockType.REPORTER,
          text: 'get IPv6 addresses',
        },
        {
          opcode: 'getPorts',
          blockType: Scratch.BlockType.REPORTER,
          text: 'get ports',
        },
        {
          opcode: 'getOtherCandidates',
          blockType: Scratch.BlockType.REPORTER,
          text: 'get other connection data',
        },
        {
          opcode: 'setTimeoutLimit',
          blockType: Scratch.BlockType.COMMAND,
          text: 'set timeout limit to [TIMEOUT] seconds',
          arguments: {
            TIMEOUT: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 5,
            },
          },
        },
      ],
    };
  }

  async _initializePeerConnection() {
    // Create a new RTCPeerConnection only if it doesn't already exist
    if (!this.peerConnection) {
      this.peerConnection = new RTCPeerConnection({ iceServers: [] });
      this.peerConnection.createDataChannel('');
      this.peerConnection.createOffer()
        .then(offer => this.peerConnection.setLocalDescription(offer))
        .catch(error => console.error('Failed to create offer:', error));

      // Setup the ICE candidate handler with debug logs
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('New ICE candidate found:', event.candidate.candidate); // Log candidate
          const candidate = event.candidate.candidate;

          // Capture IP addresses (IPv4 and IPv6) and add them to the Set
          const ipMatches = candidate.match(/([0-9]{1,3}\.){3}[0-9]{1,3}|([a-f0-9:]+)/gi);
          if (ipMatches) {
            ipMatches.forEach((ip) => {
              console.log('IP found:', ip); // Log each IP address
              this.ips.add(ip); // Use Set to ensure uniqueness
            });
          }

          // Capture port numbers and add them to the Set
          const portMatches = candidate.match(/[\s:](\d{1,5})(?=\s|$)/g);
          if (portMatches) {
            portMatches.forEach((port) => {
              console.log('Port found:', port.trim()); // Log each port
              this.ports.add(port.trim()); // Use Set to ensure uniqueness
            });
          }

          // Capture other candidate details and add them to the Set
          const otherMatches = candidate.match(/[a-z]+|[^a-zA-Z\d\s:]/g);
          if (otherMatches) {
            otherMatches.forEach((other) => {
              console.log('Other candidate info:', other); // Log other details
              this.candidates.add(other); // Use Set to ensure uniqueness
            });
          }
        } else if (!event.candidate) {
          console.log('All candidates gathered, closing connection...');
          this.peerConnection.close();
          this.peerConnection = null; // Reset peer connection
        }
      };
    }
  }

  async _gatherCandidates() {
    // Reset the Sets to clear old data before starting new collection
    this.ips.clear();
    this.ports.clear();
    this.candidates.clear();

    await this._initializePeerConnection(); // Initialize or reuse existing connection
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Gathering completed, returning data...');
        resolve({
          ips: [...this.ips],
          ports: [...this.ports],
          candidates: [...this.candidates],
        });
      }, this.timeout * 1000); // Use the timeout value set by the user (in milliseconds)
    });
  }

  async getAllIPAddresses() {
    const { ips } = await this._gatherCandidates();
    return ips.join(', '); // Returns all unique IPs
  }

  async getIPv4Addresses() {
    const { ips } = await this._gatherCandidates();
    const ipv4 = ips.filter((ip) => ip.includes('.')); // IPv4 filter
    return ipv4.join(', ');
  }

  async getIPv6Addresses() {
    const { ips } = await this._gatherCandidates();
    const ipv6 = ips.filter((ip) => ip.includes(':')); // IPv6 filter
    return ipv6.join(', ');
  }

  async getPorts() {
    const { ports } = await this._gatherCandidates();
    return ports.join(', ');
  }

  async getOtherCandidates() {
    const { candidates } = await this._gatherCandidates();
    return candidates.join(', ');
  }

  setTimeoutLimit({ TIMEOUT }) {
    this.timeout = Math.max(1, Math.min(TIMEOUT, 60)); // Ensure timeout is between 1 and 60 seconds
    console.log(`Timeout limit set to ${this.timeout} seconds.`);
  }
}

Scratch.extensions.register(new EnhancedIPAddressExtension());
})(Scratch);