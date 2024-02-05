import { useEffect, useState, useRef } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// import Chance from 'chance';
import { Client } from 'rpc-websockets';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../lib/utils.js';

export default function Register() {
  const [metadata, setMetadata] = useState('');
  const [amount, setAmount] = useState('');
  const [shop, setShop] = useState('');
  const [cancel, setCancel] = useState('');
  const [redirect, setRedirect] = useState('');
  const [deepLink, setDeepLink] = useState('firefly://');
  const [socketConnected, setSocketConnected] = useState(false);
  // const [queryParams, setQueryParams] = useState({});
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  // const formRef = useRef();
  const socket = useRef();

  const userId = uuidv4();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    // const params = Object.fromEntries(searchParams.entries());
    const fetchData = async () => {
      try {
        const response = await fetch(`${backendUrl}/shop`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const jsonData = await response.json(); // Parse JSON data
        console.log(jsonData);
        setShop(jsonData); // Set your state with the fetched data
      } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
      }
    };

    fetchData(); // Call the async function

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
      console.log('SOCKET CURRENT', socket.current);
      // console.log("CLIENT");
    };

    if (searchParams) {
      const meta = searchParams.get('m');
      const r = searchParams.get('r');
      const c = searchParams.get('c');
      // const exchange = searchParams.get('e');
      const shimmer = searchParams.get('s');

      if (meta && shimmer && r && c) {

        setMetadata(meta);

        setAmount(String(shimmer));
        setCancel(decodeURIComponent(c));
        setRedirect(decodeURIComponent(r));

        // console.log(meta);
        // console.log(r);
        // console.log(c);
        // console.log(shop.shopName);
        // console.log({ deepLink });

        if (!socket.current && !socketConnected) {
          console.log("NOT CONNECTED");
          connectSocket(shop, userId);
          console.log("SOCKET CURRENT", socket.current);
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

  return (
    <Card className="w-[360px] mx-auto my-auto mt-20">
      <a
        className={cn(
          buttonVariants({
            variant: 'default',
            className:
              'w-full inline-flex items-center justify-start leading-10 rounded-full',
          }),
        )}
        target="_blank"
        rel="noreferrer"
        href={deepLink}
      >
        Pay with Firefly Shimmer (click twice)
      </a>
    </Card>
  );
}
