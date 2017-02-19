const { Networks } = require('bitcore-lib');
const { Peer, Pool } = require('bitcore-p2p');
const contrib = require('blessed-contrib');
const blessed = require('blessed');

const screen = blessed.screen();
const grid = new contrib.grid({rows: 3, cols: 1, screen: screen});
const transactionsSet = new Set();

const peersLog = grid.set(2, 0, 1, 1, contrib.log, {
  fg: "yellow",
  // selectedFg: "green",
  label: 'Peers'
});

const transactionsLog = grid.set(0, 0, 2, 1, contrib.log, {
  fg: "green",
  // selectedFg: "green",
  label: 'transactions'
});

screen.key(['escape', 'q', 'C-c'], () => {
  pool.disconnect();
  process.exit(0);
});

const pool = new Pool({network: Networks.livenet});

pool.on('peerready', peer => {
  peersLog.log(`${peer.host}:${peer.port} - ${peer.version} ${peer.subversion}`);
});

pool.on('peerinv', (peer, inv) => {
  const transactions = inv.inventory.filter(obj => obj.type === 1);
  transactions.forEach(object => {
    const txHashStr = object.hash.toString();
    if (!transactionsSet.has(txHashStr)) {
      transactionsSet.add(txHashStr);
      const msg = peer.messages.GetData.forTransaction(object.hash);
      peer.sendMessage(msg);
    }
  });
});

pool.on('peertx', (peer, tx) => {
  const transaction = tx.transaction.toObject();
  // const formatted = util.inspect(transaction, {depth: 6, colors: true});
  const txt = `${transaction.hash}: ${transaction.outputs.map(tx => tx.satoshis).join(', ')}`;
  transactionsLog.log(txt);
});

screen.render();
pool.connect();
