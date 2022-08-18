const snowflake = require("snowflake-sdk");

const connection = snowflake.createConnection({
  account: process.env["SNOWFLAKE_ACCOUNT"],
  username: process.env["SNOWFLAKE_USER"],
  password: process.env["SNOWFLAKE_PASS"],
  application: "ES-simulations",
  database: "ETH",
  schema: "RAW"
});
connection.connect((err, conn) => {
  if (err) {
    console.error(`error connecting: ${err.message}`);
  } else {
    const connId = conn.getId();
    console.log(`opened connection ${connId}`);
    const stmt = conn.execute({
      sqlText: 'create database testdb',
      complete: (err, stmt, rows) => {
        if (err) {
          console.error(`error executing: ${err.message}`);
        } else {
          console.log(`executed: ${stmt.getSqlText()}`);
          conn.destroy((err, conn) => {
            if (err) {
              console.error(`error disconnecting: ${err.message}`);
            } else {
              console.log(`closed connection ${connId}`);
            }
          });
        }
      }
    });
  }
});
