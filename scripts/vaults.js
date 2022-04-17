const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const login = async () => {
  const url = "https://data-api.makerdao.network/v1/login/access-token";
  const params = new URLSearchParams();
  params.append("username", process.env["API_USERNAME"]);
  params.append("password", process.env["API_PASSWORD"]);
  const response = await fetch(url, {method: "post", body: params});
  const data = await response.json();
  const {access_token: token} = data;
  return token;
}

const getVaultsPage = async (token, url) => {

}

const getVaults = async (token, ilk) => {
  const url = "https://data-api.makerdao.network/v1/vaults/current_state";
  const params = new URLSearchParams();
  params.append("ilk", ilk);
  const authHeader = {Authorization: "Bearer " + token};
  params.append("limit", 1000000);
  const urlWithParams = url + "?" + params.toString();
  const response = await fetch(urlWithParams, {headers: authHeader});
  const data = await response.json();
  return data;
}

const vaults = async () => {
  const token = await login();
  const vaults = await getVaults(token, "ETH-A");
  console.log(vaults);
}

vaults();
