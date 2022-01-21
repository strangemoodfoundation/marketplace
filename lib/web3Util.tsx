function readBase64Async(file: Blob) {
    return new Promise<string | ArrayBuffer | null>((resolve, reject) => {
      let reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = reject;

      reader.readAsDataURL(file);
    })
  }

export default async function web3Upload(file: Blob) {
    const base64 = await readBase64Async(file);
    const response = await fetch("/api/ipfs", {
      method: 'POST',
      mode: 'cors',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      body: base64
    });
    const json = await response.json();
    return json["cid"];
  };