<?xml version="1.0" encoding="UTF-8"?>
<!--
Copyright (C) 2017 Jason Redding

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
-->
<xsl:stylesheet version="1.0"
								xmlns="http://www.w3.org/1999/xhtml"
								xmlns:h="http://www.w3.org/1999/xhtml"
								xmlns:r="http://witcraft.com/xsd/resume"
								xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
								exclude-result-prefixes="xsl h r">
	<xsl:preserve-space elements="*"/>
	<xsl:output method="xml" encoding="utf-8" indent="yes" omit-xml-declaration="yes"/>
	<xsl:param name="author-name" select="'1'"/>
	<xsl:param name="experience-sort" select="'descending'"/>
	<xsl:param name="system-date" select="''"/>
	<xsl:param name="factor-relevance" select="true()"/>
	<xsl:key name="level" match="/r:resume/r:meta/r:skill/r:levels/r:level" use="@value"/>
	<xsl:key name="category" match="/r:resume/r:meta/r:skill/r:categories/r:category" use="@value"/>
	<xsl:variable name="max-level">
		<xsl:for-each select="/r:resume/r:meta/r:skill/r:levels/r:level">
			<xsl:sort select="@value" data-type="number" order="descending"/>
			<xsl:if test="position() = 1">
				<xsl:value-of select="@value"/>
			</xsl:if>
		</xsl:for-each>
	</xsl:variable>
	<xsl:template match="/r:resume">
		<xsl:text disable-output-escaping="yes">&lt;!DOCTYPE html&gt;&#10;</xsl:text>
		<html>
			<head>
				<meta charset="utf-8"/>
				<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
				<meta name="viewport" content="width=device-width, initial-scale=1"/>
				<title>resume.xml -> resume.xsl -> resume.xhtml</title>
				<!--<link type="text/css" rel="stylesheet" href="/css/jquery-ui.structure.min.css"/>
				<link type="text/css" rel="stylesheet" href="/css/jquery-ui.theme.min.css"/>
				<link type="text/css" rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/jquery-mobile/1.4.5/jquery.mobile.min.css"/>-->
				<link type="text/css" rel="stylesheet" href="/css/resume.css"/>
				<link type="text/css" rel="stylesheet" href="/css/resume-print.css" media="print"/>
			</head>
			<body>
				<div class="page-wrapper ui-helper-clearfix">
					<header class="header">
						<div class="author">
							<xsl:for-each select="r:author">
								<xsl:if test="$author-name = '1' or $author-name = 'yes' or $author-name = 'true' or $author-name = 'on'">
									<h1 class="author-name">
										<xsl:value-of select="normalize-space(@name)"/>
									</h1>
								</xsl:if>
								<xsl:if test="count(r:*) > 0">
									<div class="author-contact">
										<xsl:for-each select="r:*">
											<xsl:sort select="@order" data-type="number" order="ascending"/>
											<xsl:if test="position() > 1">
												<span class="separator"></span>
											</xsl:if>
											<a>
												<xsl:attribute name="class">
													<xsl:text>ui-link author-contact-info </xsl:text>
													<xsl:value-of select="concat('author-', local-name())"/>
												</xsl:attribute>
												<xsl:choose>
													<xsl:when test="local-name() = 'address'">
														<xsl:attribute name="href">
															<xsl:text>//maps.apple.com/?</xsl:text>
															<xsl:value-of select="concat('address=', normalize-space())"/>
														</xsl:attribute>
														<xsl:attribute name="target">
															<xsl:text>_blank</xsl:text>
														</xsl:attribute>
														<address>
															<xsl:value-of select="normalize-space()"/>
														</address>
													</xsl:when>
													<xsl:when test="local-name() = 'email'">
														<xsl:attribute name="href">
															<xsl:value-of select="concat('mailto:', normalize-space())"/>
															<xsl:text>?subject=iResume</xsl:text>
														</xsl:attribute>
														<xsl:value-of select="normalize-space()"/>
													</xsl:when>
													<xsl:when test="local-name() = 'phone'">
														<xsl:attribute name="href">
															<xsl:value-of select="concat('tel:', translate(normalize-space(), '-', ''))"/>
														</xsl:attribute>
														<xsl:value-of select="normalize-space()"/>
													</xsl:when>
													<xsl:otherwise>
														<xsl:value-of select="normalize-space()"/>
													</xsl:otherwise>
												</xsl:choose>
											</a>
										</xsl:for-each>
									</div>
								</xsl:if>
							</xsl:for-each>
						</div>
					</header>
					<main>
						<div class="main-inner">
							<xsl:for-each select="r:description">
								<div class="section-heading">
									<xsl:attribute name="data-section">
										<xsl:value-of select="local-name()"/>
									</xsl:attribute>
									<xsl:choose>
										<xsl:when test="string-length(normalize-space(@title)) > 0">
											<xsl:value-of select="@title"/>
										</xsl:when>
										<xsl:otherwise>
											<xsl:text>Description</xsl:text>
										</xsl:otherwise>
									</xsl:choose>
								</div>
								<div class="section-content">
									<xsl:attribute name="data-section">
										<xsl:value-of select="local-name()"/>
									</xsl:attribute>
									<xsl:apply-templates mode="html"/>
								</div>
							</xsl:for-each>
							<xsl:for-each select="r:skills">
								<div class="section-heading">
									<xsl:attribute name="data-section">
										<xsl:value-of select="local-name()"/>
									</xsl:attribute>
									<xsl:choose>
										<xsl:when test="string-length(normalize-space(@title)) > 0">
											<xsl:value-of select="@title"/>
										</xsl:when>
										<xsl:otherwise>
											<xsl:text>Skills</xsl:text>
										</xsl:otherwise>
									</xsl:choose>
								</div>
								<div class="section-content">
									<xsl:attribute name="data-section">
										<xsl:value-of select="local-name()"/>
									</xsl:attribute>
									<div class="skills">
										<xsl:choose>
											<xsl:when test="boolean($factor-relevance)">
												<xsl:variable name="relevant-skills" select="r:skill[r:categories/r:category/@value = 'relevant']"/>
												<xsl:variable name="more-skills" select="r:skill[not(r:categories/r:category/@value = 'relevant')]"/>
												<div class="skills-group-relevant">
													<xsl:for-each select="$relevant-skills">
														<xsl:sort select="r:level/@value" data-type="number" order="descending"/>
														<xsl:sort select="concat(r:experience/r:since, '_', r:experience/r:until)" data-type="text" order="ascending"/>
														<xsl:call-template name="list-skills"/>
													</xsl:for-each>
												</div>
												<div class="skills-group-others">
													<xsl:for-each select="$more-skills">
														<xsl:sort select="r:level/@value" data-type="number" order="descending"/>
														<xsl:sort select="concat(r:experience/r:since, '_', r:experience/r:until)" data-type="text" order="ascending"/>
														<xsl:call-template name="list-skills"/>
													</xsl:for-each>
												</div>
											</xsl:when>
											<xsl:otherwise>
												<xsl:for-each select="r:skill">
													<xsl:sort select="r:name" order="ascending"/>
													<xsl:call-template name="list-skills"/>
												</xsl:for-each>
											</xsl:otherwise>
										</xsl:choose>
									</div>
								</div>
							</xsl:for-each>
							<xsl:for-each select="r:employers">
								<div class="section-heading">
									<xsl:attribute name="data-section">
										<xsl:value-of select="local-name()"/>
									</xsl:attribute>
									<xsl:choose>
										<xsl:when test="string-length(normalize-space(@title)) > 0">
											<xsl:value-of select="@title"/>
										</xsl:when>
										<xsl:otherwise>
											<xsl:text>Employers</xsl:text>
										</xsl:otherwise>
									</xsl:choose>
								</div>
								<div class="section-content">
									<xsl:attribute name="data-section">
										<xsl:value-of select="local-name()"/>
									</xsl:attribute>
									<xsl:for-each select="r:employer">
										<div class="employer-title">
											<xsl:value-of select="normalize-space(r:title)"/>
										</div>
										<xsl:for-each select="r:positions/r:position">
											<xsl:sort select="r:timeline/r:start-date" data-type="text" order="{$experience-sort}"/>
											<div class="position-container">
												<div class="position-title">
													<xsl:value-of select="normalize-space(r:title)"/>
												</div>
												<xsl:for-each select="r:timeline">
													<div class="timeline-container">
														<span class="timeline-start">
															<xsl:for-each select="r:start-date">
																<xsl:call-template name="date-eval">
																	<xsl:with-param name="symbolic" select="@symbolic"/>
																	<xsl:with-param name="truncate-to" select="@truncate-to"/>
																</xsl:call-template>
															</xsl:for-each>
														</span>
														<xsl:text> - </xsl:text>
														<span class="timeline-end">
															<xsl:choose>
																<xsl:when test="count(r:end-date) > 0">
																	<xsl:for-each select="r:end-date">
																		<xsl:call-template name="date-eval">
																			<xsl:with-param name="symbolic" select="@symbolic"/>
																			<xsl:with-param name="truncate-to" select="@truncate-to"/>
																		</xsl:call-template>
																	</xsl:for-each>
																</xsl:when>
																<xsl:otherwise>
																	<xsl:text>Present</xsl:text>
																</xsl:otherwise>
															</xsl:choose>
														</span>
													</div>
												</xsl:for-each>
												<xsl:for-each select="r:projects">
													<!--<div class="projects-selector">
														<select id="project-selector" onchange="window.location = '#' + this[this.selectedIndex].value;">
															<option value="">- Jump to Project -</option>
															<xsl:for-each select="r:project">
																<xsl:sort select="r:title" data-type="text" order="ascending"/>
																<option>
																	<xsl:attribute name="value">
																		<xsl:value-of select="translate(normalize-space(r:title), ' ABCDEFGHIJKLMNOPQRSTUVWXYZ', '-abcdefghijklmnopqrstuvwxyz')"/>
																	</xsl:attribute>
																	<xsl:value-of select="normalize-space(r:title)"/>
																</option>
															</xsl:for-each>
														</select>
													</div>-->
													<div class="projects-container">
														<xsl:for-each select="r:project">
															<div class="project-item">
																<div class="project-title">
																	<!--<a>
																		<xsl:attribute name="name">
																			<xsl:value-of select="translate(normalize-space(r:title), ' ABCDEFGHIJKLMNOPQRSTUVWXYZ', '-abcdefghijklmnopqrstuvwxyz')"/>
																		</xsl:attribute>
																		<xsl:attribute name="href">
																			<xsl:value-of select="concat('#', translate(normalize-space(r:title), ' ABCDEFGHIJKLMNOPQRSTUVWXYZ', '-abcdefghijklmnopqrstuvwxyz'))"/>
																		</xsl:attribute>
																	</a>-->
																	<span class="project-title-text">
																		<xsl:value-of select="normalize-space(r:title)"/>
																	</span>
																	<xsl:if test="string-length(normalize-space(r:link)) > 0">
																		<xsl:text>  </xsl:text>
																		<a href="{normalize-space(r:link)}" target="_blank" class="project-link">
																			<xsl:value-of select="normalize-space(r:link)"/>
																		</a>
																	</xsl:if>
																</div>
																<xsl:for-each select="r:description">
																	<div class="project-description">
																		<xsl:apply-templates mode="html"/>
																	</div>
																</xsl:for-each>
															</div>
														</xsl:for-each>
													</div>
												</xsl:for-each>
												<xsl:for-each select="r:description">
													<div class="position-description">
														<xsl:apply-templates mode="html"/>
													</div>
												</xsl:for-each>
											</div>
										</xsl:for-each>
									</xsl:for-each>
								</div>
							</xsl:for-each>
						</div>
					</main>
				</div>
			</body>
		</html>
	</xsl:template>

	<xsl:template name="list-skills">
		<xsl:param name="skills" select="."/>
		<xsl:variable name="experience-ongoing" select="string-length(normalize-space(r:experience/r:until)) = 0"/>
		<xsl:variable name="experience-since-year">
			<xsl:call-template name="date-eval">
				<xsl:with-param name="truncate-to" select="'year'"/>
				<xsl:with-param name="date" select="normalize-space(r:experience/r:since)"/>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="experience-until-year">
			<xsl:call-template name="date-eval">
				<xsl:with-param name="truncate-to" select="'year'"/>
				<xsl:with-param name="date">
					<xsl:choose>
						<xsl:when test="$experience-ongoing">
							<xsl:value-of select="$system-date"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="normalize-space(r:experience/r:until)"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="experience-years">
			<xsl:call-template name="get-duration">
				<xsl:with-param name="from-year" select="$experience-since-year"/>
				<xsl:with-param name="to-year" select="$experience-until-year"/>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="skill-level" select="r:level/@value"/>
		<xsl:variable name="meta-skill-level" select="key('level', floor($skill-level))"/>
		<xsl:variable name="skill-level-preposition">
			<xsl:choose>
				<xsl:when test="count($meta-skill-level[@preposition]) > 0">
					<xsl:value-of select="normalize-space($meta-skill-level/@preposition)"/>
				</xsl:when>
				<xsl:when test="count(/r:resume/r:meta/r:skill/r:levels[@preposition]) > 0">
					<xsl:value-of select="normalize-space(/r:resume/r:meta/r:skill/r:levels/@preposition)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:text>at</xsl:text>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:if test="position() > 1">
			<xsl:text>, </xsl:text>
		</xsl:if>
		<span class="skill">
			<xsl:attribute name="class">
				<xsl:text>skill skill-name</xsl:text>
				<xsl:value-of select="concat(' level-', $skill-level)"/>
				<xsl:for-each select="r:categories/r:category">
					<xsl:value-of select="concat(' category-', @value)"/>
				</xsl:for-each>
			</xsl:attribute>
			<xsl:attribute name="title">
				<xsl:value-of select="normalize-space($meta-skill-level)"/>
				<xsl:value-of select="concat(' (', ($skill-level div $max-level) * 100, '%) ')"/>
				<xsl:value-of select="$skill-level-preposition"/>
				<xsl:text> </xsl:text>
				<xsl:value-of select="normalize-space(r:name)"/>
				<xsl:text> with </xsl:text>
				<xsl:value-of select="$experience-years"/>
				<xsl:text> year</xsl:text>
				<xsl:if test="not(number($experience-years) = 1)">
					<xsl:text>s</xsl:text>
				</xsl:if>
				<xsl:text> of experience</xsl:text>
				<!--<xsl:text>&#10;&#10;</xsl:text>
			<xsl:choose>
				<xsl:when test="count(r:categories/r:category) = 1">
					<xsl:text>Category: </xsl:text>
				</xsl:when>
				<xsl:when test="count(r:categories/r:category) > 1">
					<xsl:text>Categories: </xsl:text>
				</xsl:when>
			</xsl:choose>
			<xsl:for-each select="r:categories/r:category">
				<xsl:sort select="normalize-space(key('category', @value))" data-type="text" order="ascending"/>
				<xsl:if test="position() > 1">
					<xsl:text>, </xsl:text>
				</xsl:if>
				<xsl:value-of select="normalize-space(key('category', @value))"/>
				</xsl:for-each>-->
			</xsl:attribute>
			<xsl:attribute name="data-level-value">
				<xsl:value-of select="normalize-space($skill-level)"/>
			</xsl:attribute>
			<xsl:attribute name="data-level">
				<xsl:value-of select="normalize-space(key('level', floor($skill-level)))"/>
			</xsl:attribute>
			<xsl:attribute name="data-level-percentage">
				<xsl:value-of select="($skill-level div $max-level)"/>
			</xsl:attribute>
			<xsl:attribute name="data-since">
				<xsl:call-template name="date-eval">
					<xsl:with-param name="date" select="r:experience/r:since"/>
					<xsl:with-param name="truncate-to" select="'year'"/>
				</xsl:call-template>
			</xsl:attribute>
			<xsl:attribute name="data-until">
				<xsl:value-of select="$experience-until-year"/>
			</xsl:attribute>
			<xsl:attribute name="data-experience-years">
				<xsl:value-of select="$experience-years"/>
			</xsl:attribute>
			<xsl:attribute name="data-experience-duration">
				<xsl:value-of select="concat('P', $experience-years, 'Y')"/>
			</xsl:attribute>
			<span class="text">
				<xsl:value-of select="normalize-space(r:name)"/>
			</span>
		</span>
	</xsl:template>

	<xsl:template name="handle-html" match="h:*|text()" mode="html">
		<xsl:if test="count(self::*) > 0">
			<xsl:element name="{local-name()}">
				<xsl:apply-templates mode="html" select="@*"/>
				<xsl:apply-templates mode="html"/>
			</xsl:element>
		</xsl:if>
		<xsl:if test="count(self::text()) > 0">
			<xsl:call-template name="handle-text">
				<xsl:with-param name="text" select="."/>
			</xsl:call-template>
		</xsl:if>
	</xsl:template>

	<xsl:template name="get-duration" match="r:duration" mode="html">
		<xsl:param name="from-year">
			<xsl:if test="count(self::r:duration[@from]) > 0">
				<xsl:value-of select="normalize-space(@from)"/>
			</xsl:if>
		</xsl:param>
		<xsl:param name="to-year">
			<xsl:if test="count(self::r:duration[@to]) > 0">
				<xsl:value-of select="normalize-space(@to)"/>
			</xsl:if>
		</xsl:param>
		<xsl:variable name="start-year">
			<xsl:call-template name="date-eval">
				<xsl:with-param name="truncate-to" select="'year'"/>
				<xsl:with-param name="date">
					<xsl:choose>
						<xsl:when test="string-length(normalize-space($from-year)) > 0">
							<xsl:value-of select="normalize-space($from-year)"/>
						</xsl:when>
						<xsl:when test="string-length($system-date) > 0">
							<xsl:value-of select="$system-date"/>
						</xsl:when>
					</xsl:choose>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="end-year">
			<xsl:call-template name="date-eval">
				<xsl:with-param name="truncate-to" select="'year'"/>
				<xsl:with-param name="date">
					<xsl:choose>
						<xsl:when test="string-length(normalize-space($to-year)) > 0">
							<xsl:value-of select="normalize-space($to-year)"/>
						</xsl:when>
						<xsl:when test="string-length($system-date) > 0">
							<xsl:value-of select="$system-date"/>
						</xsl:when>
						<xsl:when test="string-length(/r:resume/@last-modified) > 0">
							<xsl:value-of select="/r:resume/@last-modified"/>
						</xsl:when>
					</xsl:choose>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="duration">
			<xsl:choose>
				<xsl:when test="(number($end-year) - number($start-year)) = 0">
					<xsl:value-of select="1"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="(number($end-year) - number($start-year))"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>

		<xsl:choose>
			<xsl:when test="string-length($start-year) > 0 and string-length($end-year) > 0">
				<xsl:choose>
					<xsl:when test="count(self::r:duration) > 0">
						<xsl:text> </xsl:text>
						<xsl:element name="time">
							<xsl:attribute name="datetime">
								<xsl:text>P</xsl:text>
								<xsl:value-of select="concat($duration, 'Y')"/>
							</xsl:attribute>
							<xsl:attribute name="title">
								<xsl:value-of select="concat('Since ', $start-year)"/>
							</xsl:attribute>
							<xsl:value-of select="$duration"/>
							<xsl:value-of select="concat(' ', normalize-space(@unit))"/>
						</xsl:element>
						<xsl:text> </xsl:text>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$duration"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:when>
			<xsl:otherwise>
				<xsl:if test="count(self::r:duration) > 0">
					<xsl:text> </xsl:text>
				</xsl:if>
				<xsl:value-of select="normalize-space(text())"/>
				<xsl:if test="count(self::r:duration) > 0">
					<xsl:text> </xsl:text>
				</xsl:if>
				<xsl:message terminate="no">
					<xsl:text disable-output-escaping="yes">&lt;duration&gt; using fallback value: </xsl:text>
					<xsl:value-of select="concat('&quot;', normalize-space(text()), '&quot;')"/>
				</xsl:message>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<!--<xsl:template name="duration" match="r:duration" mode="html">
		<xsl:variable name="from-year">
			<xsl:choose>
				<xsl:when test="count(self::r:duration[@from]) > 0">
					<xsl:call-template name="date-eval">
						<xsl:with-param name="truncate-to" select="'year'"/>
						<xsl:with-param name="date" select="@from"/>
					</xsl:call-template>
				</xsl:when>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="to-year">
			<xsl:call-template name="date-eval">
				<xsl:with-param name="truncate-to" select="'year'"/>
				<xsl:with-param name="date">
					<xsl:choose>
						<xsl:when test="count(self::r:duration[@to]) > 0">
							<xsl:value-of select="@to"/>
						</xsl:when>
						<xsl:when test="string-length($system-date) > 0">
							<xsl:value-of select="$system-date"/>
						</xsl:when>
					</xsl:choose>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="duration">
			<xsl:choose>
				<xsl:when test="(number($to-year) - number($from-year)) = 0">
					<xsl:value-of select="1"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="(number($to-year) - number($from-year))"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:choose>
			<xsl:when test="string-length($from-year) > 0 and string-length($to-year) > 0">
				<xsl:element name="time">
					<xsl:attribute name="datetime">
						<xsl:text>P</xsl:text>
						<xsl:value-of select="concat($duration, 'Y')"/>
					</xsl:attribute>
					<xsl:attribute name="title">
						<xsl:value-of select="concat('Since ', $from-year)"/>
					</xsl:attribute>
					<xsl:value-of select="concat(' ', $duration, ' ', normalize-space(@unit), ' ')"/>
				</xsl:element>
				<xsl:message terminate="no">
					<xsl:text disable-output-escaping="yes">&lt;duration&gt; using </xsl:text>
					<xsl:value-of select="concat('(', $to-year, ' - ', $from-year, ')')"/>
				</xsl:message>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="concat(' ', normalize-space(text()), ' ')"/>
				<xsl:message terminate="no">
					<xsl:text disable-output-escaping="yes">&lt;duration&gt; using fallback value: </xsl:text>
					<xsl:value-of select="concat('&quot;', normalize-space(text()), '&quot;')"/>
				</xsl:message>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>-->

	<xsl:template match="@*" mode="html">
		<xsl:attribute name="{local-name()}">
			<xsl:value-of select="."/>
		</xsl:attribute>
	</xsl:template>

	<xsl:template name="handle-text">
		<xsl:param name="text" select="''"/>
		<xsl:choose>
			<xsl:when test="string-length($text) > 0 and string-length(normalize-space($text)) = 0">
				<xsl:text> </xsl:text>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="normalize-space($text)"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	
	<xsl:template name="date-eval" match="r:start-date | r:end-date">
		<xsl:param name="date" select="."/>
		<xsl:param name="symbolic">
			<xsl:value-of select="normalize-space($date) = 'now' or normalize-space($date) = 'present'"/>
		</xsl:param>
		<xsl:param name="truncate-to" select="''"/>
		<xsl:variable name="value" select="normalize-space($date)"/>
		<xsl:choose>
			<xsl:when test="$symbolic = 'present'">
				<xsl:text>Present</xsl:text>
			</xsl:when>
			<xsl:otherwise>
				<xsl:choose>
					<xsl:when test="$truncate-to = 'year'">
						<xsl:call-template name="grab-until">
							<xsl:with-param name="text" select="$value"/>
							<xsl:with-param name="token" select="'-'"/>
						</xsl:call-template>
					</xsl:when>
					<xsl:when test="$truncate-to = 'month'">
						<xsl:call-template name="grab-until">
							<xsl:with-param name="text" select="$value"/>
							<xsl:with-param name="token" select="'-'"/>
							<xsl:with-param name="skip-count" select="1"/>
						</xsl:call-template>
					</xsl:when>
					<xsl:when test="$truncate-to = 'day'">
						<xsl:call-template name="grab-until">
							<xsl:with-param name="text" select="$value"/>
							<xsl:with-param name="token" select="'-'"/>
							<xsl:with-param name="skip-count" select="2"/>
						</xsl:call-template>
					</xsl:when>
					<xsl:when test="$truncate-to = 'hour'">
						<xsl:call-template name="grab-until">
							<xsl:with-param name="text" select="$value"/>
							<xsl:with-param name="token" select="'T'"/>
						</xsl:call-template>
						<xsl:if test="contains($value, 'T')">
							<xsl:text>T</xsl:text>
						</xsl:if>
						<xsl:call-template name="grab-until">
							<xsl:with-param name="text" select="substring-after($value, 'T')"/>
							<xsl:with-param name="token" select="':'"/>
						</xsl:call-template>
					</xsl:when>
					<xsl:when test="$truncate-to = 'minute'">
						<xsl:call-template name="grab-until">
							<xsl:with-param name="text" select="$value"/>
							<xsl:with-param name="token" select="'T'"/>
						</xsl:call-template>
						<xsl:if test="contains($value, 'T')">
							<xsl:text>T</xsl:text>
						</xsl:if>
						<xsl:call-template name="grab-until">
							<xsl:with-param name="text" select="substring-after($value, 'T')"/>
							<xsl:with-param name="token" select="':'"/>
							<xsl:with-param name="skip-count" select="1"/>
						</xsl:call-template>
					</xsl:when>
					<xsl:when test="$truncate-to = 'second'">
						<xsl:call-template name="grab-until">
							<xsl:with-param name="text" select="$value"/>
							<xsl:with-param name="token" select="'T'"/>
						</xsl:call-template>
						<xsl:if test="contains($value, 'T')">
							<xsl:text>T</xsl:text>
						</xsl:if>
						<xsl:call-template name="grab-until">
							<xsl:with-param name="text" select="substring-after($value, 'T')"/>
							<xsl:with-param name="token" select="':'"/>
							<xsl:with-param name="skip-count" select="2"/>
						</xsl:call-template>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$value"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template name="grab-until">
		<xsl:param name="text" select="."/>
		<xsl:param name="token" select="','"/>
		<xsl:param name="skip-count" select="0"/>
		<xsl:param name="index" select="0"/>
		<xsl:param name="include-skipped" select="true()"/>
		<xsl:choose>
			<xsl:when test="$index = $skip-count">
				<xsl:choose>
					<xsl:when test="contains($text, $token)">
						<xsl:value-of select="substring-before($text, $token)"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$text"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:when>
			<xsl:when test="$index > $skip-count"/>
			<xsl:otherwise>
				<xsl:if test="boolean($include-skipped)">
					<xsl:choose>
						<xsl:when test="contains($text, $token)">
							<xsl:value-of select="substring-before($text, $token)"/>
							<xsl:value-of select="$token"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="$text"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:if>
				<xsl:call-template name="grab-until">
					<xsl:with-param name="text" select="substring-after($text, $token)"/>
					<xsl:with-param name="token" select="$token"/>
					<xsl:with-param name="skip-count" select="$skip-count"/>
					<xsl:with-param name="index" select="$index + 1"/>
				</xsl:call-template>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template name="skill-ref" match="r:skill" mode="html">
		<xsl:variable name="skill-ref" select="."/>
		<xsl:variable name="ref-name" select="translate(normalize-space($skill-ref/@name), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ', 'abcdefghijklmnopqrstuvwxyz-')"/>
		<xsl:variable name="ref" select="/r:resume/r:skills/r:skill[translate(normalize-space(r:name), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ', 'abcdefghijklmnopqrstuvwxyz-') = $ref-name]"/>
		<xsl:value-of select="concat(' ', normalize-space($skill-ref))"/>
	</xsl:template>
</xsl:stylesheet>
