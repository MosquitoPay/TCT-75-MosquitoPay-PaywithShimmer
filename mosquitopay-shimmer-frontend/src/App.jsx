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
import { Client } from "rpc-websockets";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';

export default function App() {
  const [shop, setShop] = useState('');
  const [queryParams, setQueryParams] = useState({});
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const formRef = useRef();
  const socket = useRef();

  useEffect(() => {
    console.log({ backendUrl });

    const searchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(searchParams.entries());

    setQueryParams(queryParams);

    if (!queryParams) {
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
    } else {
      console.log({ shop });
    }
  }, []);

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
        {queryParams ? (
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
        ) : (
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
        )}
      </div>
    </>
  );
}
