import { Match } from '../entities/Match';
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
import { Message } from '../entities/Message';

@ObjectType()
class MatchOutput {
   // ? means undefined
   @Field({ nullable: true })
   error?: string;

   @Field({ nullable: true })
   success?: boolean;
}

@Resolver(Match)
export class MatchResolver {
   @FieldResolver(() => [Message])
   async inbox(@Root() match: Match, @Ctx() { req }: MyContext) {
      // await Message.find({
      //    where: [
      //       { userId: req.session.userId, receiverId: 1},
      //       { userId: , receiverId: req.session.userId},
      //    ],
      // });
   }

   @FieldResolver(() => User)
   async user1(@Root() match: Match): Promise<User | undefined> {
      const user = await User.findOne({ id: match.user1.id });
      return user;
   }

   @FieldResolver(() => User)
   async user2(@Root() match: Match): Promise<User | undefined> {
      const user = await User.findOne({ id: match.user2.id });
      return user;
   }

   @Query(() => [Match])
   async getAllMatches() {
      return Match.find({ relations: ['user1', 'user2'] });
   }

   @Mutation(() => MatchOutput)
   async match(
      @Arg('matchUserId', () => Int) matchUserId: number,
      @Ctx() { req }: MyContext
   ): Promise<MatchOutput> {
      if (matchUserId === req.session.userId) {
         return {
            error: 'Cant add yourself',
         };
      }

      const alreadyMatched = await Match.findOne({
         where: [
            {
               user1: req.session.userId,
               user2: matchUserId,
               userResponse1: 1,
               userResponse2: 1,
            },
            {
               user2: req.session.userId,
               user1: matchUserId,
               userResponse1: 1,
               userResponse2: 1,
            },
         ],
      });

      if (alreadyMatched) {
         return {
            success: true,
         };
      }

      const user1 = await User.findOne({ id: req.session.userId });
      const user2 = await User.findOne({ id: matchUserId });
      // Check if one of the users already added the other
      const existingMatch = await Match.findOne({
         where: [
            { user1: req.session.userId, user2: matchUserId },
            { user2: req.session.userId, user1: matchUserId },
         ],
      });

      // if match is existing update
      if (existingMatch) {
         const updatedMatch = await Match.update(
            { id: existingMatch.id },
            { userResponse1: 1, userResponse2: 1 }
         );
         if (updatedMatch.affected !== 1) {
            return {
               error: 'Error updating in database',
            };
         }

         console.log('Updating match');
         return { success: true };
      }

      // Match is new
      const newMatch = await Match.create({
         userResponse1: 1,
         user1,
         user2,
      }).save();

      if (!newMatch) {
         return {
            error: 'Error creating match',
         };
      }

      return {
         success: true,
      };
   }
}
