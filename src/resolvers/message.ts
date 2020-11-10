import { Message } from '../entities/Message';
import {
   Arg,
   Ctx,
   Field,
   FieldResolver,
   Int,
   Mutation,
   ObjectType,
   Query,
   Resolver,
   Root,
} from 'type-graphql';
import { MyContext } from '../utilities/types';
import { User } from '../entities/User';

@ObjectType()
class InboxOutput {
   // ? means undefined
   @Field({ nullable: true })
   username?: string;

   @Field({ nullable: true })
   latestText?: string;
}

@Resolver(Message)
export class MessageResolver {
   //Queries
   @FieldResolver(() => User)
   async receiver(@Root() message: Message): Promise<User | null> {
      const user = await User.findOne({
         where: { id: message.receiverId },
      });

      if (!user) {
         return null;
      }

      user.username =
         user!.username.charAt(0).toUpperCase() + user!.username.slice(1);

      return user;
   }

   @Query(() => [InboxOutput])
   async inbox(@Ctx() { req }: MyContext): Promise<InboxOutput[]> {
      await Message.find({ id: req.session.userId });
   }

   @Query(() => [Message])
   async conversation(
      @Arg('receiverId', () => Int) receiverId: number,
      @Ctx() { req }: MyContext
   ): Promise<Message[]> {
      return Message.find({
         where: [
            { userId: req.session.userId, receiverId },
            { userId: receiverId, receiverId: req.session.userId },
         ],
      });
   }

   @Query(() => [Message])
   async getAllMessage(): Promise<Message[]> {
      return await Message.find();
   }

   //Mutations
   @Mutation(() => Boolean)
   async message(
      @Arg('message') text: string,
      @Arg('userId', () => Int) userId: number,
      @Ctx() { req }: MyContext
   ) {
      try {
         const user = await User.findOne({ id: req.session.userId });
         const receiver = await User.findOne({ id: userId });

         await Message.create({
            text,
            user,
            receiver,
         }).save();

         return true;
      } catch (error) {
         console.log(error);
         return false;
      }
   }
}
