import { useEffect, useState, useRef } from 'react';

import { Button } from '@/components/ui/button';
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

  useEffect(() => {
    console.log({ backendUrl });

    const searchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(searchParams.entries());

    setQueryParams(params);

    if (!shop) {
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

    let response = await fetch('/api/balance', {
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
        <Card className="w-[360px] mx-auto my-auto">
          <CardHeader>
            <CardTitle>Register shop</CardTitle>
            <CardDescription>Register your shop in one-click.</CardDescription>
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
      </div>
    </>
  );
}
