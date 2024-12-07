import { Client, Account, ID } from "appwrite";
import { conf } from "../../conf/conf";

export class AuthService
{
  client: Client;
  account: Account;
  constructor()
  {
    this.client = new Client()
      .setEndpoint( conf.appwriteEndpoint ) // Your API Endpoint
      .setProject( conf.appwrtieProjectId );
    this.account = new Account( this.client );
  }

  async createEmailAndPassUser ( email: string, password: string, name: string )
  {
    try
    {
      const userAccount = await this.account.create( ID.unique(), email, password, name )
      if ( userAccount )
      {
        return this.login( email, password )
      } else
      {
        return userAccount
      }
    } catch ( err )
    {
      throw err
    }
  }

  async login ( email: string, password: string )
  {
    try
    {
      return this.account.createEmailPasswordSession( email, password );
    } catch ( err )
    {
      throw err
    }
  }

  async getCurrentUser ()
  {
    try
    {
      return this.account.get()
    } catch ( err )
    {
      console.log( "Appwrite service :: getCurrentUser :: ", err )
      return null
    }
  }

  async logout ()
  {
    const session = await this.account.getSession( "current" )
    return this.account.deleteSession( session.$id )
  }
}


export const authService = new AuthService();