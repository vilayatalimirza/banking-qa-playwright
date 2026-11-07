import type { Page } from '@playwright/test';
import { AccountDetailsPage } from './AccountDetailsPage';
import { BillPayPage } from './BillPayPage';
import { HomePage } from './HomePage';
import { OpenAccountPage } from './OpenAccountPage';
import { OverviewPage } from './OverviewPage';
import { RegisterPage } from './RegisterPage';
import { RequestLoanPage } from './RequestLoanPage';
import { TransferPage } from './TransferPage';
import { UpdateProfilePage } from './UpdateProfilePage';

/** One object holding every page object for a single browser page. */
export class Pages {
  readonly home: HomePage;
  readonly register: RegisterPage;
  readonly overview: OverviewPage;
  readonly details: AccountDetailsPage;
  readonly openAccount: OpenAccountPage;
  readonly transfer: TransferPage;
  readonly billPay: BillPayPage;
  readonly loan: RequestLoanPage;
  readonly profile: UpdateProfilePage;

  constructor(page: Page) {
    this.home = new HomePage(page);
    this.register = new RegisterPage(page);
    this.overview = new OverviewPage(page);
    this.details = new AccountDetailsPage(page);
    this.openAccount = new OpenAccountPage(page);
    this.transfer = new TransferPage(page);
    this.billPay = new BillPayPage(page);
    this.loan = new RequestLoanPage(page);
    this.profile = new UpdateProfilePage(page);
  }
}
