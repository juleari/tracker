<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:ssi="ssi"
                xmlns:static="static"
                extension-element-prefixes="ssi static"
                version="1.0"
        >

    <xsl:output method="html" encoding="utf-8" doctype-system="about:legacy-compat" indent="yes" />

    <xsl:decimal-format decimal-separator=","/>


    <xsl:template match="block[@id='informers']/whc2014">
        <style>
            <xsl:text>.hockey__picture-bg{background-image: url(</xsl:text>
            <xsl:value-of select="event_header_image"/>
            <xsl:text>)}</xsl:text>
        </style>

        <!-- hockey-gap-fix - Грязный хак, чтобы закрыть виднеющийся 
                под контентом баннер, у которого position fixed -->
        <div class="hockey-gap-fix"></div>
        <div class="hockey">
            <div class="hockey__black-bg"></div>
            <div class="hockey__picture-bg"></div>

            <div class="hockey__inner sizefix">

                <div class="hockey__header">
                    <div class="hockey__title">Чемпионат мира по хоккею с шайбой</div>
                    <div class="hockey__subtitle">Минск (Белоруссия), 9 – 25 мая 2014 года</div>
                </div>


                <div class="hockey__panels">
                    <!--Расписание матчей-->
                    <div class="hockey__rasp">
                        <xsl:choose>
                            <xsl:when test="event_schedule[@finished = 'True']">
                                <div class="hockey__rasp-finished">Чемпионат мира завершен</div>
                            </xsl:when>
                            <xsl:otherwise>
                                <a href="{event_schedule/schedule_link}" class="hockey__rasp-title" target="_blank">Расписание</a>
                                <div class="hockey__rasp-table">
                                    <table class="rasp-table">
                                        <xsl:apply-templates select="event_schedule/match[@type='schedule']" mode="schedule"/>
                                    </table>
                                </div>
                            </xsl:otherwise>
                        </xsl:choose>
                    </div>

                    <!--Статические ссылки в третьей колонке-->
                    <div class="hockey__links">
                        <a href="http://www.championat.com/hockey/_whc/900/team/18668/result.html?utm_source=cmh_rambler_shapka" target="_blank" class="hockey__link">Сборная России на ЧМ</a>
                        <a href="http://www.championat.com/photo/hockey/?utm_source=cmh_rambler_shapka" target="_blank" class="hockey__link">Фотогалерея</a>
                        <a href="http://www.championat.com/hockey/_whc/900/statistic/player/bombardir.html?utm_source=cmh_rambler_shapka" target="_blank" class="hockey__link">Бомбардиры</a>

                        <a href="http://www.championat.com/hockey/_whc.html?utm_source=cmh_rambler_shapka" target="_blank" class="hockey__champ-link"></a>
                    </div>

                    <!--Средняя колонка с результами -->
                    <div class="hockey__results">
                        <xsl:choose>
                            <!--Если результатов нет, считаем, что чемпионат еще не начался или первый матч не завершился-->
                            <xsl:when test="count(event_schedule/match[@type='results']) = 0">
                                <div class="hockey__results-placeholder">Первые результаты появятся 9 мая в 17:45</div>
                            </xsl:when>
                            <xsl:otherwise>
                                <div class="match-result">
                                    <xsl:apply-templates select="event_schedule/match[@type='results']" mode="results"/>
                                </div>
                            </xsl:otherwise>
                        </xsl:choose>
                    </div>
                </div>
            </div>
        </div>
    </xsl:template>


    <!--Расписание чемпионата-->
    <xsl:template match="match" mode="results">
        <xsl:if test="position() &lt;= 4">
            <div>
                <!--Для листалки. Первый реузальтат будет видимым, остальные скрыты-->
                <xsl:attribute class">
                        <xsl:text> match-result__score-display</xsl:text>
                        <xsl:choose>
                            <xsl:when test="position() = 1">
                                <xsl:text> match-result__score-display_visible</xsl:text>
                            </xsl:when>
                            <xsl:otherwise>
                                <xsl:text> match-result__score-display_hidden</xsl:text>
                            </xsl:otherwise>
                        </xsl:choose>
                </xsl:attribute>

                <div class="match-result__rotators">
                    <xsl:if test="count(//event_schedule/match[@type='results']) &gt; 1">
                        <div class="match-result__rotator match-result__rotator_1"></div>
                        <div class="match-result__tab-title"><xsl:value-of select="round"/></div>
                        <div class="match-result__rotator match-result__rotator_2"></div>
                    </xsl:if>
                </div>

                <div class="match-result__main">
                    <div class="match-result__country match-result__country_1"><xsl:value-of select="team1"/></div>
                    <a href="{link}" class="match-result__scores" target="_blank">
                        <xsl:value-of select="result"/>
                        <!--Тестовые данные-->
                        <!--9:11-->
                    </a>
                    <div class="match-result__country match-result__country_2"><xsl:value-of select="team2"/></div>
                </div>

                <div class="match-result__status"><xsl:value-of select="status"/></div>
            </div>
        </xsl:if>
    </xsl:template>

    <!--Результаты матчей (последние 4)-->
    <xsl:template match="match" mode="schedule">
        <xsl:if test="position() &lt;= 4">
            <tr class="rasp-table__line">
                <td class="rasp-table__cell"><xsl:value-of select="date"/></td>
                <td class="rasp-table__cell"><xsl:value-of select="time"/></td>
                <td class="rasp-table__cell">
                    <xsl:value-of select="team1"/>
                    <xsl:text> - </xsl:text>
                    <xsl:value-of select="team2"/>

                    <!--Тестовые данные-->
                    <!--Швейцария - Белоруссия-->
                </td>
            </tr>
        </xsl:if>
    </xsl:template>

</xsl:stylesheet>

