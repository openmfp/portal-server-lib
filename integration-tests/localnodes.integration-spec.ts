import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import {
  PortalModule,
  ContentConfigurationLuigiDataService,
  LuigiNode,
  ContentConfiguration,
} from '../src';

describe('LocalnodesController', () => {
  let app: INestApplication;
  let contentConfigurationLuigiDataService: ContentConfigurationLuigiDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PortalModule.create({})],
    }).compile();

    contentConfigurationLuigiDataService =
      module.get<ContentConfigurationLuigiDataService>(
        ContentConfigurationLuigiDataService
      );

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  describe('POST /rest/localnodes param validation', () => {
    it('should return BadRequest on invalid params when no params', async () => {
      await request(app.getHttpServer())
        .post(`/rest/localnodes`)
        .send({})
        .expect(400);
    });

    it('should return BadRequest on invalid params when no contentConfigurations', async () => {
      await request(app.getHttpServer())
        .post(`/rest/localnodes`)
        .send({
          location: '',
          contentConfigurations: [{}],
        })
        .expect(400);
    });

    it('should return BadRequest on invalid params when no contentConfigurations', async () => {
      await request(app.getHttpServer())
        .post(`/rest/localnodes`)
        .send({
          language: 'any',
        })
        .expect(400);
    });

    it('should return BadRequest on invalid params when no language', async () => {
      await request(app.getHttpServer())
        .post(`/rest/localnodes`)
        .send({
          contentConfigurations: [{}],
        })
        .expect(400);
    });

    it('should return BadRequest on invalid params when contentConfigurations empty', async () => {
      await request(app.getHttpServer())
        .post(`/rest/localnodes`)
        .send({
          language: 'any',
          contentConfigurations: [null],
        })
        .expect(400);
    });

    it('should call the getLuigiData method on valid params', async () => {
      const resultingNodes: LuigiNode[] = [];
      const getLuigiData = jest
        .spyOn(contentConfigurationLuigiDataService, 'getLuigiData')
        .mockReturnValue(Promise.resolve(resultingNodes));

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { body } = await request(app.getHttpServer())
        .post(`/rest/localnodes`)
        .send({
          language: 'any',
          contentConfigurations: [{}],
        })
        .expect(201);

      expect(getLuigiData).toBeCalled();
      expect(body).toStrictEqual([]);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
