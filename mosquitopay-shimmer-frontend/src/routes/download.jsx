import { useEffect, useState, useRef } from 'react';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import Chance from 'chance';
import { Client } from 'rpc-websockets';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../lib/utils.js';

export default function Register() {
  const [metadata, setMetadata] = useState('');
  const [registered, setRegistered] = useState(false);
  const [amount, setAmount] = useState('');
  const [shop, setShop] = useState('');
  const [deepLink, setDeepLink] = useState('firefly://');
  const [socketConnected, setSocketConnected] = useState(false);
  // const [queryParams, setQueryParams] = useState({});
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  // const formRef = useRef();
  const socket = useRef();

  const userId = uuidv4();

  useEffect(() => {

    fetch(backendUrl + '/shop')
      .then((response) => {
        console.log('RESP: ', response);
        response
          .json()
          .then((resp) => {
            // console.log({ resp });
            console.log(resp.body);
            if (resp.shop) {
              setShop(resp);
              setRegistered(true);
            }
          })
          .catch((err) => {
            console.error(err);
          });
      })
      .catch((error) => {
        console.error(error);
      });

   

  }, []);




  const downloadPlugin = async (evt) => {
    evt.preventDefault();

    fetch(`${backendUrl}/plugin`, {
      method: 'GET',
    })
      .then((response) => response.blob())
      .then((blob) => {
        // Create blob link to download
        const url = window?.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `MP.Woocommerce.zip`);

        // Append to html link element page
        document.body.appendChild(link);

        // Start download
        link.click();

        // Clean up and remove the link
        link.parentNode.removeChild(link);
      });
  };

  return (
      <div className="flex flex-col h-screen w-screen">
          <Card className="w-[360px] mx-auto my-auto">
            <CardHeader>
              <CardTitle>Shop</CardTitle>
              <CardDescription>Registered shop.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="shopname">Shop Name</Label>
                  <Input
                    id="shopname"
                    type="text"
                    value={shop.shopName}
                    disable
                  />
                </div>
              </div>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="apikey">API Key</Label>
                  <Input id="apikey" type="text" value={shop.apiKey} disable />
                </div>
              </div>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="webhookkey">Webhook Key</Label>
                  <Input
                    id="webhookkey"
                    type="text"
                    value={shop.webhookKey}
                    disable
                  />
                </div>
              </div>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="wallet">Shop Wallet Address</Label>
                  <Input
                    id="wallet"
                    type="text"
                    value={shop.shopShimmerWalletAddress}
                    disable
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={downloadPlugin}>Download Plugin</Button>
            </CardFooter>
          </Card>
      </div>
  );
}
