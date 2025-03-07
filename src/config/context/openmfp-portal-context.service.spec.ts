import { OpenmfpPortalContextService } from './openmfp-portal-context.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('OpenmfpPortalContextService', () => {
  let openmfpPortalContextService: OpenmfpPortalContextService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenmfpPortalContextService],
    }).compile();

    openmfpPortalContextService = module.get<OpenmfpPortalContextService>(
      OpenmfpPortalContextService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should execute getContextValues', async () => {
    //Arrange
    const value = 'abcd';
    process.env['OPENMFP_PORTAL_CONTEXT_VARIABLE_NAME'] = value;

    //Act
    const contextValues = await openmfpPortalContextService.getContextValues();

    //Assert
    expect(contextValues).toEqual({ variableName: value });
  });
});
