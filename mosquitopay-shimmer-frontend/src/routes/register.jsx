import { useRef } from 'react';

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
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  // const formRef = useRef();
  const fileRef = useRef();
  const navigate = useNavigate();

  const submitHandler = async (evt) => {
    evt.preventDefault();
    //
    const formData = new FormData();

    formData.append('shop', fileRef.current.files[0]);

    const response = await fetch(`${backendUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    console.log(response);
    if (response.ok) {
      navigate('/download');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen">
      <Card className="w-[360px] mx-auto my-auto">
        <CardHeader>
          <CardTitle>Register shop</CardTitle>
          <CardDescription>Register your shop in one-click.</CardDescription>
        </CardHeader>
        <form onSubmit={submitHandler}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="details">Shop Details</Label>
                <Input id="details" type="file" accept=".json" ref={fileRef} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="submit">Register</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
