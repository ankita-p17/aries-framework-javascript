import { EventEmitter } from 'events';
import { Repository } from '../../storage/Repository';
import { ConnectionRecord } from '../../storage/ConnectionRecord';
import { JsonEncoder } from '../../utils/JsonEncoder';
import { ProofRecord } from '../../storage/ProofRecord';
import { PresentationRequestMessage } from './messages/PresenationRequestMessage';
import { Attachment } from './messages/Attachment';
import { ProofStates } from './ProofStates';
import { ProofRequest } from './messages/ProofRequest';

export enum EventType {
  StateChanged = 'stateChanged',
}

export class ProofService extends EventEmitter {
  private proofPresentationRepository: Repository<ProofRecord>;

  public constructor(credentialRepository: Repository<ProofRecord>) {
    super();
    this.proofPresentationRepository = credentialRepository;
  }

  /**
   * Create a new proof presentation request.
   * The presentation request will not be bound to any proposal or existing connection.
   *
   * @param connection Connection to which verifier wants to send presentation request
   * @param presenationRequestTemplate Template for presentation
   * @returns Presentation Request object
   */
  public async createPresentationRequest(
    connection: ConnectionRecord,
    { comment, proofRequest }: presenationRequestTemplate
  ): Promise<PresentationRequestMessage> {
    const attachment = new Attachment({
      // id: "libindy-request-presentation-0",
      mimeType: 'application/json',
      data: {
        base64: JsonEncoder.toBase64(proofRequest),
      },
    });
    const presentationReq = new PresentationRequestMessage({
      comment,
      attachments: [attachment],
    });

    const presentation = new ProofRecord({
      connectionId: connection.id,
      presentationRequest: presentationReq,
      state: ProofStates.PresentationSent,
      tags: { threadId: presentationReq.id },
    });
    await this.proofPresentationRepository.save(presentation);
    this.emit(EventType.StateChanged, { presentation, prevState: null });
    return presentationReq;
  }

  public async getAll(): Promise<ProofRecord[]> {
    return this.proofPresentationRepository.findAll();
  }

  public async find(id: string): Promise<ProofRecord> {
    return this.proofPresentationRepository.find(id);
  }
}

export interface presenationRequestTemplate {
  comment?: string;
  proofRequest: ProofRequest;
}
