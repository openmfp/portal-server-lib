import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import {
  PortalModule,
  ContentConfigurationLuigiDataService,
  LuigiNode,
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
    it('should return BadRequest on invalid entity name', async () => {
      await request(app.getHttpServer()).post(`/rest/localnodes`).expect(400);
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
