const snowflake = require("snowflake-sdk");

const query = (sqlText, blockNumber, onLoad, onFail) => {
  const connection = snowflake.createConnection({
    account: process.env["SNOWFLAKE_ACCOUNT"],
    username: process.env["SNOWFLAKE_USER"],
    password: process.env["SNOWFLAKE_PASS"],
    application: "ES-simulations",
    database: process.env["SNOWFLAKE_DB"],
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

const promiseQuery = (sqlText, blockNumber) => {
  return new Promise((resolve, reject) => {
    query(sqlText, blockNumber, resolve, reject);
  }).catch(error => {
    console.error(error);
    process.exit();
  });
}

const getHolders = blockNumber => {
  const sqlText = `
select distinct location,
    last_value(curr_value) over (partition by location order by block, order_index) as balance
from storage_diffs
where contract = '0x6b175474e89094c44da98b954eedeac495271d0f' and
    location like '2[%].0' and status and block <= :1
qualify balance != '0x';
`;
  return promiseQuery(sqlText, blockNumber);
}

const getCropHolders = blockNumber => {
  const sqlText = `
select distinct TOPIC2
from EVENTS
where CONTRACT = '0x82d8bfdb61404c796385f251654f6d7e92092b5d'
    and TOPIC0 = '0x0e64978d073561c3dfd4d4e3e4dce066cde2ab246a44f990fabb0a21a4a3bd95'
    and STATUS
    and BLOCK <= 16000000;
`;
  return promiseQuery(sqlText, blockNumber);
}

module.exports = {
  getHolders,
  getCropHolders,
}
