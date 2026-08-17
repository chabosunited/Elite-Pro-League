-- EPL v21.2: additional official match rules requested for league play.
-- Rules are inserted into the existing "3. Spielregeln" section and remain editable in the Admin rulebook.

INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'match_no_gk_block','Torwart nicht blockieren','Das absichtliche Blockieren oder Behinderung des gegnerischen Torwarts ist verboten. Insbesondere darf der Torwart bei Abschlägen, Abwürfen, Flanken oder sonstigen spielentscheidenden Aktionen nicht gezielt am Ausführen einer normalen Torwartaktion gehindert werden. Führt ein nachweisbarer Verstoß zu einer spielentscheidenden Situation oder beeinflusst er das Spielergebnis erheblich, kann die EPL-Ligaleitung die Partie als Def-Lose gegen das verursachende Team werten.','CRITICAL',40 FROM league_rule_sections WHERE code='match_rules';

INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'match_freekick_goal_line','Freistöße – kein Spieler auf der Torlinie','Bei gegnerischen Freistößen darf kein Feldspieler absichtlich direkt auf der eigenen Torlinie positioniert werden, um das Tor zusätzlich zum Torwart abzudecken. Bei Eckstößen ist das Positionieren von Feldspielern auf oder unmittelbar an der Torlinie erlaubt.','IMPORTANT',50 FROM league_rule_sections WHERE code='match_rules';

INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'match_no_time_wasting','Zeitspiel verboten','Absichtliches Zeitspiel ist verboten. Dazu zählen insbesondere das gezielte Verzögern von Spielfortsetzungen sowie ein offensichtlich ausschließlich auf Zeitgewinn ausgelegtes Verhalten ohne sportlichen Spielzweck.','CRITICAL',60 FROM league_rule_sections WHERE code='match_rules';

INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'match_no_substitutions','Keine Spielereinwechslungen','Spielereinwechslungen sind in offiziellen EPL-Ligaspielen verboten. Nach Spielbeginn dürfen keine zusätzlichen oder anderen Spieler eingewechselt werden; es spielen ausschließlich die zum Start der Partie eingesetzten Spieler.','CRITICAL',70 FROM league_rule_sections WHERE code='match_rules';

INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'match_player_height_free','Keine Einschränkung der Spielergröße','Für die Körpergröße beziehungsweise Ingame-Größe eines Pro-Spielers bestehen in der EPL keine Einschränkungen. Jeder Spieler darf die von EA FC angebotenen Größen frei verwenden.','INFO',80 FROM league_rule_sections WHERE code='match_rules';

INSERT OR IGNORE INTO league_rules(section_id,code,title,body,severity,sort_order)
SELECT id,'match_playstyles_free','Keine Einschränkung der PlayStyles','Für PlayStyles und PlayStyles+ bestehen in der EPL keine zusätzlichen Liga-Einschränkungen. Spieler dürfen die im jeweiligen EA-FC-Spiel regulär verfügbaren PlayStyles frei verwenden.','INFO',90 FROM league_rule_sections WHERE code='match_rules';
