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
import { cn } from './lib/utils.js';

export default function App() {
  const [metadata, setMetadata] = useState('');
  const [registered, setRegistered] = useState(false);
  const [amount, setAmount] = useState('');
  const [shop, setShop] = useState('');
  const [cancel, setCancel] = useState('');
  const [redirect, setRedirect] = useState('');
  const [deepLink, setDeepLink] = useState('firefly://');
  const [socketConnected, setSocketConnected] = useState(false);
  // const [queryParams, setQueryParams] = useState({});
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  // const formRef = useRef();
  const fileRef = useRef();
  const socket = useRef();

  const userId = uuidv4();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    // const params = Object.fromEntries(searchParams.entries());

    fetch(backendUrl + '/shop')
      .then((response) => {
        console.log('RESP: ', response);
        response
          .json()
          .then((resp) => {
            console.log({ resp });
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

    const onConnect = () => {
      setSocketConnected(true);
      socket?.current?.subscribe('transaction'); //Success can be tracked from here r and c!!
    };

    const onDisconnect = () => {
      setSocketConnected(false);
    };

    const connectSocket = (shop, user) => {
      console.log({ shop, user });

      socket.current = new Client(
        `${import.meta.env.VITE_RPC_URL}/shopid/${shop}/user/${user}`,
      );
      socket.current.on('open', onConnect);
      socket.current.on('close', onDisconnect);
      console.log("SOCKET CURRENT", socket.current);
      // console.log("CLIENT");
    };

    if (searchParams) {
      const meta = searchParams.get('m');
      const r = searchParams.get('r');
      const c = searchParams.get('c');
      // const exchange = searchParams.get('e');
      const shimmer = searchParams.get('s');

      if (meta && shimmer && r && c) {
        // const shop = sId.split("|")[2];

        setMetadata(meta);

        setAmount(String(shimmer));
        setCancel(decodeURIComponent(c));
        setRedirect(decodeURIComponent(r));

        console.log({ deepLink });

        if (!socket.current && !socketConnected) {
          // console.log("NOT CONNECTED");
          connectSocket(shop, userId);
          // console.log("SOCKET CURRENT", socket.current);
        } else {
          setDeepLink(
            `firefly://wallet/send/${shop.shopShimmerWalletAddress}/?amount=${amount}&tag=${userId}&metadata=${metadata}`,
          );
        }
      }
    }

    return () => {
      if (socket.current && socketConnected) {
        socket.current.close();
        socket.current.on('open', onConnect);
        socket.current.on('close', onDisconnect);
        // console.log("SOCKET CURRENT", socket.current);
      }
    };
  }, []);

  useEffect(() => {
    if (socket.current && socketConnected) {
      setDeepLink(
        `firefly://wallet/send/${shop.shopShimmerWalletAddress}/?amount=${amount}&tag=${userId}&metadata=${metadata}`,
      );
      // socket.current.call('wallet', [shop]).then((respWallet) => {
      //   console.log(respWallet);
      //   setDeepLink(
      //     `firefly://wallet/send/${shop.shopShimmerWalletAddress}/?amount=${amount}&tag=${userId}&metadata=${metadata}`,
      //   );
      // });
    }
    // console.log(deepLink);
  }, [socketConnected]);

  if (socket.current && socketConnected) {
    socket.current.on('transaction', (params) => {
      console.log('TRANSACTION PARAMS: ', params);
      if (params === 'FINISHED') {
        setTimeout(() => {
          window.location.href = redirect;
        }, 3000);
      }

      if (params === 'FAILED') {
        setTimeout(() => {
          window.location.href = cancel;
        }, 3000);
      }
    });
  }

  const submitHandler = async (evt) => {
    evt.preventDefault();

    //
    const formData = new FormData();
    formData.append('shop', fileRef.current.files[0]);
    // const data = Object.fromEntries(formData.entries());

    let response = await fetch(`${backendUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    console.log(response);

    window.location.reload();
  };

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
    <>
      <div className="flex flex-col h-screen w-screen">
        {shop ? (
            <Card className="w-[360px] mx-auto my-auto">
              <a
                className={cn(
                  buttonVariants({
                    variant: 'default',
                    className:
                      'w-full inline-flex items-center justify-start leading-10 rounded-full border-fireflyb hover:shadow-fireflyb',
                  }),
                )}
                target="_blank"
                rel="noreferrer"
                href={deepLink}
              >
                Pay with Firefly Shimmer (click twice)
              </a>
            </Card>
          ) : (
            registered ?
            (
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
                    <Input
                      id="apikey"
                      type="text"
                      value={shop.apiKey}
                      disable
                    />
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
          ) : (
          <Card className="w-[360px] mx-auto my-auto">
            <CardHeader>
              <CardTitle>Register shop</CardTitle>
              <CardDescription>
                Register your shop in one-click.
              </CardDescription>
            </CardHeader>
            <form onSubmit={submitHandler}>
              <CardContent>
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="details">Shop Details</Label>
                    <Input
                      id="details"
                      type="file"
                      accept="application/json"
                      ref={fileRef}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="submit">Register</Button>
              </CardFooter>
            </form>
          </Card>
        ))}
      </div>
    </>
  );
}
