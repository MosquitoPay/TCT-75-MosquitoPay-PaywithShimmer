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

export default function Register() {
  const [shop, setShop] = useState('');

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    // Define an async function inside the useEffect
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
      <Card className="mx-auto my-auto">
        <CardHeader>
          <CardTitle>Shop</CardTitle>
          <CardDescription>Registered shop.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <CardContent>Name: {shop.shopName}</CardContent>
            </div>
          </div>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <CardContent>API KEY: {shop.apiKey}</CardContent>
            </div>
          </div>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <CardContent>Webhook Key: {shop.webhookKey}</CardContent>
            </div>
          </div>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <CardContent>
                Wallet Adress: {shop.shopShimmerWalletAddress}
              </CardContent>
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
