import { User } from '../entities/User';
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
import { Match } from '../entities/Match';
import { MyContext } from '../utilities/types';
import { UserInput } from '../utilities/userInput';
import { validateRegister } from '../utilities/validateRegister';
import argon2 from 'argon2';

@ObjectType()
class FieldError {
   // ? means undefined
   @Field()
   field: string;

   @Field()
   message: string;
}

@ObjectType()
class Me {
   // ? means undefined
   @Field({ nullable: true })
   username?: String;

   @Field({ nullable: true })
   id?: String;

   @Field({ nullable: true })
   email?: String;
}

@ObjectType()
class UserResponse {
   // ? means undefined
   @Field(() => [FieldError], { nullable: true })
   errors?: FieldError[];

   @Field(() => User, { nullable: true })
   user?: User;
}

@Resolver(User)
export class UserResolver {
   @FieldResolver(() => [User])
   async matches(
      @Root() user: User,
      @Ctx() { req }: MyContext
   ): Promise<User[]> {
      const matches = await Match.find({
         where: [
            { user1: req.session.userId, userResponse1: 1, userResponse2: 1 },
            { user2: req.session.userId, userResponse1: 1, userResponse2: 1 },
         ],
         relations: ['user1', 'user2'],
      });

      const userArray: User[] = [];
      matches.map((match) => {
         match.user1.id !== user.id
            ? userArray.push(match.user1)
            : userArray.push(match.user2);
      });
      console.log(userArray);

      return userArray;
   }

   // Queries
   @Query(() => Me)
   async me(@Ctx() { req }: MyContext) {
      if (!req.session.userId) {
         return null;
      }
      const user = await User.findOne(req.session.userId, {
         select: ['username', 'id', 'email'],
      });

      return { ...user };
   }

   @Query(() => [User])
   async users(): Promise<User[]> {
      return await User.find();
   }

   @Query(() => User)
   async user(@Arg('id', () => Int) id: number): Promise<User | undefined> {
      return await User.findOne(id);
   }

   // Mutations
   @Mutation(() => UserResponse)
   async login(
      @Arg('usernameOrEmail') usernameOrEmail: String,
      @Arg('password') password: String,
      @Ctx() { req }: MyContext
   ): Promise<UserResponse> {
      const user = await User.findOne(
         usernameOrEmail.includes('@')
            ? { where: { email: usernameOrEmail } }
            : { where: { username: usernameOrEmail } }
      );

      if (!user) {
         return {
            errors: [
               {
                  field: 'usernameOrEmail',
                  message: "Username doesn't exist",
               },
            ],
         };
      }

      const validPassword = await argon2.verify(
         user.password,
         password as string | Buffer
      );

      if (!validPassword) {
         return {
            errors: [
               {
                  field: 'password',
                  message: 'Invalid login, Please try again!',
               },
            ],
         };
      }

      req.session.userId = user.id;

      return { user };
   }

   //Mutations
   @Mutation(() => UserResponse)
   async register(
      @Arg('args') { password, ...args }: UserInput,
      @Ctx() { req }: MyContext
   ): Promise<UserResponse> {
      const errors = validateRegister({ password, ...args });

      if (errors) {
         return { errors };
      }

      try {
         const hashedPassword = await argon2.hash(password);

         const user = await User.create({
            password: hashedPassword,
            ...args,
         }).save();

         req.session.userId = user.id;
         console.log(req.session);
         return { user };
      } catch (error) {
         console.log(`ERROR: ${error}`);
         if (error.code === '23505') {
            console.log('DUPLICATE KEY!!');
            if (error.detail.includes('username')) {
               return {
                  errors: [
                     {
                        field: 'username',
                        message: 'username already taken',
                     },
                  ],
               };
            }

            return {
               errors: [
                  {
                     field: 'email',
                     message: 'email already taken',
                  },
               ],
            };
         }
         return {
            errors: [
               {
                  field: 'Server',
                  message: 'Server error',
               },
            ],
         };
      }
   }
}
