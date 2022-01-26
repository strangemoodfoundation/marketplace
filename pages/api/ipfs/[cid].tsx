import { NextApiRequest, NextApiResponse } from 'next';
import { Web3Storage, File } from 'web3.storage';

/**
 *
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // TODO: Update for storing/retreiving non-json
    try {
        if (!process.env.WEB_3_STORAGE_TOKEN)
            return res.status(500).end("Missing web3.storage token");
        const web3Client = new Web3Storage({ token: process.env.WEB_3_STORAGE_TOKEN })
        switch (req.method) {
            case 'GET':
                const cid = req.query['cid'] as string;
                // Use web3.storage to get cid file
                const web3_res = await web3Client.get(cid);
                if (!web3_res || !web3_res.ok)
                    return res.status(500).send(`failed to get cid: ${cid} - [${web3_res?.status}] ${web3_res?.statusText}`);
                const web3_files = await web3_res.files();
                const buffer = await web3_files[0].arrayBuffer()// We should only ever retreive a single file
                return res.end(Buffer.from(buffer));
            default:
                res.setHeader('Allow', ['GET'])
                return res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send('Something went wrong');
    }
}
