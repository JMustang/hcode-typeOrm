import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { AuthRegisterEntity } from './entities/auth-register.entity';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer/dist';
import { UserEntity } from 'src/user/entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  private issuer = 'login';
  private audience = 'users';
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly mailer: MailerService,

    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  crateToken(user: UserEntity) {
    return {
      accessToken: this.jwtService.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        {
          expiresIn: '7 days',
          subject: String(user.id),
          issuer: this.issuer,
          audience: this.audience,
          // secret: String(process.env.JWT_SECRET),
        },
      ),
    };
  }

  checkToken(token: string) {
    try {
      const data = this.jwtService.verify(token, {
        audience: this.audience,
        issuer: this.issuer,
      });
      return data;
    } catch (e) {
      throw new BadGatewayException(e);
    }
  }

  isValidToken(token: string) {
    try {
      this.checkToken(token);
      return true;
    } catch (e) {
      return false;
    }
  }

  async login(email: string, password: string) {
    const user = await this.usersRepository.findOneBy({
      email,
    });

    if (!user) {
      throw new UnauthorizedException({
        message: `Email or password is incorrect.`,
      });
    }
    if (!(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException({
        message: `Email or password is incorrect.`,
      });
    }

    return this.crateToken(user);
  }
  async forget(email: string) {
    const user = await this.usersRepository.findOneBy({
      email,
    });

    if (!user) {
      throw new UnauthorizedException({
        message: `Incorrect email.`,
      });
    }
    await this.mailer.sendMail({
      subject: 'email recovery',
      to: email,
      template: 'forgot',
      context: {
        name: user.name,
        link: '',
      },
    });
    return true;
  }

  async reset(password: string, token: string) {
    // TODO: Validations token
    //   const id = 0;

    //   const user = await this.prisma.user.update({
    //     where: {
    //       id,
    //     },
    //     data: {
    //       password,
    //     },
    //   });
    //   return this.crateToken(user);
    // }

    try {
      const data: any = this.jwtService.verify(token, {
        issuer: 'forget',
        audience: 'users',
      });

      if (isNaN(Number(data.id))) {
        throw new BadRequestException('Invalid token');
      }

      const salt = await bcrypt.genSalt();
      password = await bcrypt.hash(password, salt);

      await this.usersRepository.update(Number(data.id), {
        password,
      });

      const user = await this.userService.readOne(Number(data.id));

      return this.crateToken(user);
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  async register(data: AuthRegisterEntity) {
    const user = await this.userService.create(data);

    return this.crateToken(user);
  }
}
