import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

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
  const [shop, setShop] = useState({})
  const backendUrl = "http://localhost:8888/shop"
  const hasShop = useRef(false)

  useEffect(() => {
    console.log({ backendUrl })
    if (!hasShop.current) {
      fetch(backendUrl)
      .then((response) => {
        response.json()
        .then((resp) => {
          console.log({ resp })
          if (resp.shop) {
            setShop(resp)
            hasShop.current = true
          }
        })
        .catch((err) => {
          console.error(err)
        })
      })
      .catch((error) => {
        console.error(error)
      })
    } else {
      console.log({ shop })
    }
  }, []);

  return (
    <>
      <div className="flex flex-col h-screen w-screen">
        <Card className="w-[360px] mx-auto my-auto">
          <CardHeader>
            <CardTitle>Register shop</CardTitle>
            <CardDescription>
              Register your shop in one-click.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form>
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
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button>Register</Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
