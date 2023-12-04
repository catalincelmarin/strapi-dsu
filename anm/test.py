import mysql.connector

# Establish a connection to the MySQL database
conn = mysql.connector.connect(
    host='192.168.79.51',
    port='3306',
    user='strapi',
    password='strapi-@sts',
    database='dsu4'
)

# Create a cursor to interact with the database
cursor = conn.cursor()

# Execute a SELECT query
query = "select ip.* from ip_points ip  inner join ip_points_ip_category_links ic ON ip_point_id = ip.id WHERE ip_category_id = 10;"
cursor.execute(query)

defib_template = {
  "cui":"000000000",
  "company_name": "IGSU",
  "address": None,
  "phone": "112",
  "device_model": "Defibrilator Sali",
  "expiry_date": "2025-12-31 00:00:00.000",
  "can_call_emergency":1
}


# Fetch the results
rows = cursor.fetchall()
columns = [column[0] for column in cursor.description]

# Display the results
counter = 1
for row in rows:
    row_data = dict(zip(columns, row))
#    print(row_data)
#    continue
    defib_template["address"] = row_data['adresa']
    defib_template["phone"] = row_data['numar_telefon']
    ps = ['%s' for i in defib_template]
    #print(",".join(ps))
    insert_query = f"INSERT INTO defibrilators ({','.join(list(defib_template.keys()))}) VALUES ({','.join(ps)})"

    # Define the values to be inserted
    values = tuple(defib_template.values())  # Replace with your actual values
    print(insert_query)
    print(values)
#    continue
    # Execute the INSERT query with the provided values
    cursor.execute(insert_query, values)

    # Commit the changes
    conn.commit()
    last_inserted_id = cursor.lastrowid

    insert_query = f"INSERT INTO ip_points_defibrilator_links (ip_point_id,defibrilator_id) VALUES (%s,%s)"
    values = (row_data["id"],last_inserted_id)
    print(values)
    cursor.execute(insert_query, values)
    conn.commit()

    insert_query = f"INSERT INTO defibrilator_schedules_defibrilator_id_links (defibrilator_schedule_id,defibrilator_id,defibrilator_schedule_order) VALUES(%s,%s,%s)"
    values = (27,last_inserted_id,counter)
    counter += 1
    cursor.execute(insert_query, values)
    conn.commit()
# Close the cursor and connection
cursor.close()
conn.close()
