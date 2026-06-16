-- Recorrências (e outros lançamentos planejados) podem não ter conta nem
-- cartão vinculados. Relaxa a regra: proíbe apenas ter conta E cartão juntos.

alter table transactions drop constraint if exists src_account_xor_card;

alter table transactions
  add constraint src_not_both check (
    not (account_id is not null and card_id is not null)
  );
