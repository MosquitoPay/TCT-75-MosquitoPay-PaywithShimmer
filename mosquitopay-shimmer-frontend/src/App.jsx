import { useEffect, useState, useRef } from 'react';

import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from './lib/utils';
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
import { Client } from 'rpc-websockets';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
  const [metaData, setMetaData] = useState('');
  const [amount, setAmount] = useState('');
  const [shop, setShop] = useState('');
  const [cancel, setCancel] = useState('');
  const [redirect, setRedirect] = useState('');
  const [deepLink, setDeepLink] = useState('firefly://');
  const [socketConnected, setSocketConnected] = useState(false);
  // const [queryParams, setQueryParams] = useState({});
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const formRef = useRef();
  const socket = useRef();

  const userID = uuidv4();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    // const params = Object.fromEntries(searchParams.entries());

    fetch(backendUrl)
      .then((response) => {
        response
          .json()
          .then((resp) => {
            console.log({ resp });
            if (resp.shop) {
              setShop(resp);
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
      socket?.current?.subscribe('wallet');
      socket?.current?.subscribe('transaction'); //Success can be tracked from here r and c!!
    };

    const onDisconnect = () => {
      setSocketConnected(false);
    };

    const connectSocket = (shop, user) => {
      console.log({ shop, user });

      socket.current = new Client(`${backendUrl}/shopid/${shop}/user/${user}`);
      socket.current.on('open', onConnect);
      socket.current.on('close', onDisconnect);
      // console.log("SOCKET CURRENT", socket.current);
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

        setMetaData(meta);

        setAmount(String(shimmer));
        setCancel(decodeURIComponent(c));
        setRedirect(decodeURIComponent(r));

        if (!socket.current && !socketConnected) {
          // console.log("NOT CONNECTED");
          connectSocket(shop, userID);
          // console.log("SOCKET CURRENT", socket.current);
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
      socket.current.call('wallet', [shop]).then((respWallet) => {
        console.log(respWallet);
        setDeepLink(
          `firefly://wallet/send/${
            respWallet.iota
          }/?amount=${amount}&tag=${btoa(
            `mosquitopay|${shop}`,
          )}&metadata=${metaData}`,
        );
      });
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

  const submitHandler = async () => {
    const formData = new FormData(formRef.current);
    const data = Object.fromEntries(formData.entries());

    let response = await fetch(`${backendUrl}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    console.log(response);
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
          <Card className="w-[360px] mx-auto my-auto">
            <CardHeader>
              <CardTitle>Register shop</CardTitle>
              <CardDescription>
                Register your shop in one-click.
              </CardDescription>
            </CardHeader>
            <form ref={formRef} onSubmit={submitHandler}>
              <CardContent>
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="name">Shop URL</Label>
                    <Input id="name" placeholder="Shop URL" />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="details">Shop Details</Label>
                    <Input id="details" type="file" accept="application/json" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="submit">Register</Button>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </>
  );
}
