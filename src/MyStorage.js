import { AuthClientStorage } from "@dfinity/auth-client/lib/cjs/storage";

export class MyStorage
{
   myState = "";

   async get(key) {
      return this.myState;
   } 

   async set(key, value) {
      this.myState = value;
   }

   async remove(key) {
      this.myState = "";
   }
}