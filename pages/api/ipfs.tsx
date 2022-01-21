import { Blob } from 'node:buffer';
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
            case 'POST':
                if (!req.body)
                    return res.status(400).end("Missing request body");
                const buff = Buffer.from(req.body.split(',')[1], 'base64')
                const web3_file = new File([buff], "data");
                const cid = await web3Client.put([web3_file], { wrapWithDirectory: false })
                return res.status(200).json({cid: cid});
            default:
                res.setHeader('Allow', ['POST'])
                return res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send('Something went wrong');
    }
}
