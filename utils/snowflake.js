const snowflake = require("snowflake-sdk");

const query = (sqlText, blockNumber, onLoad, onFail) => {

  const connection = snowflake.createConnection({
    account: process.env["SNOWFLAKE_ACCOUNT"],
    username: process.env["SNOWFLAKE_USER"],
    password: process.env["SNOWFLAKE_PASS"],
    application: "ES-simulations",
    database: "ETH",
    schema: "RAW",
    jsTreatIntegerAsBigInt: true,
  });
  connection.connect((err, conn) => {
    if (err) {
      onFail(`error connecting: ${err.message}`);
    } else {
      const connId = conn.getId();
      console.log(`opened connection ${connId}`);
      const stmt = conn.execute({
        sqlText: sqlText,
        binds: [blockNumber],
        complete: (err, stmt, rows) => {
          if (err) {
            onFail(`error executing: ${err.message}`);
          } else {
            console.log(`obtained ${rows.length} rows`);
            conn.destroy((err, conn) => {
              if (err) {
                onFail(`error disconnecting: ${err.message}`);
              } else {
                console.log(`closed connection ${connId}`);
                onLoad(rows);
              }
            });
          }
        }
      });
      console.log("executing query…");
    }
  });
}

const getHolders = blockNumber => {
  return new Promise((resolve, reject) => {
    const sqlText = `
select distinct location,
    last_value(curr_value) over (partition by location order by block, order_index) as balance
from storage_diffs
where contract = '0x6b175474e89094c44da98b954eedeac495271d0f' and
    location like '2[%].0' and status and block <= :1
qualify balance != '0x';
`;
    query(sqlText, blockNumber, resolve, reject);
  }).catch(error => {
    console.error(error);
    process.exit();
  });
}

module.exports = {
  getHolders,
}
