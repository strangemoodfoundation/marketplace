import httpProxyMiddleware from "next-http-proxy-middleware";
import { NextApiRequest, NextApiResponse } from "next";

export default (req: NextApiRequest, res: NextApiResponse) => httpProxyMiddleware(req, res, {
  // You can use the `http-proxy` option
  target:'https://api.web3.storage/',
  headers: {"authorization": `Bearer ${process.env.WEB_3_STORAGE_TOKEN}`},
  // In addition, you can use the `pathRewrite` option provided by `next-http-proxy`
  pathRewrite: [{
    patternStr: '^/api/web3',
    replaceStr: ''
  }],
});

export const config = {
	api: {
		bodyParser: false
	}
};
